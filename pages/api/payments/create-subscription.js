import Stripe from 'stripe';
import { db } from '../../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { verifyIdToken } from '../../../lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;
    const { plan, paymentMethodId } = req.body;

    // Get user data
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    // Create or get Stripe customer
    let customerId = userData.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          firebaseUID: userId
        }
      });
      customerId = customer.id;

      // Update user with Stripe customer ID
      await setDoc(doc(db, 'users', userId), {
        ...userData,
        stripeCustomerId: customerId
      }, { merge: true });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Define price IDs for each plan (you'll need to create these in Stripe)
    const priceIds = {
      'pro': 'price_pro_49_monthly', // Replace with actual Stripe price ID
      'team': 'price_team_149_monthly',
      'enterprise': 'price_enterprise_500_monthly'
    };

    if (!priceIds[plan]) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceIds[plan] }],
      default_payment_method: paymentMethodId,
      expand: ['latest_invoice.payment_intent'],
    });

    // Update user with subscription info
    await setDoc(doc(db, 'users', userId), {
      ...userData,
      subscriptionId: subscription.id,
      subscriptionPlan: plan,
      subscriptionStatus: subscription.status,
      subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000)
    }, { merge: true });

    // Create usage tracking document
    await setDoc(doc(db, 'usage', userId), {
      userId: userId,
      plan: plan,
      apiCallsThisMonth: 0,
      sandboxHoursThisMonth: 0,
      lastResetDate: new Date(),
      limits: {
        'pro': { apiCalls: 50000, sandboxHours: 100 },
        'team': { apiCalls: 200000, sandboxHours: 500 },
        'enterprise': { apiCalls: -1, sandboxHours: -1 } // Unlimited
      }[plan]
    });

    res.status(200).json({
      success: true,
      subscription: subscription,
      message: 'Subscription created successfully'
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ 
      error: 'Failed to create subscription',
      details: error.message 
    });
  }
}
