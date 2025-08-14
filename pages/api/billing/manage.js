import Stripe from 'stripe';
import { ResourceManager } from '../../../lib/resource-manager.js';
import { verifyFirebaseToken } from '../../../lib/auth.js';
import { db } from '../../../lib/firebase.js';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resourceManager = new ResourceManager();

export default async function handler(req, res) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decodedToken = await verifyFirebaseToken(token);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    const { action } = req.body;

    switch (action) {
      case 'create_subscription':
        const { priceId, paymentMethodId } = req.body;
        
        // Create or get Stripe customer
        let customer;
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (userDoc.exists() && userDoc.data().stripeCustomerId) {
          customer = await stripe.customers.retrieve(userDoc.data().stripeCustomerId);
        } else {
          customer = await stripe.customers.create({
            email: userEmail,
            metadata: { userId }
          });
          
          // Save customer ID
          if (db) {
            await updateDoc(doc(db, 'users', userId), {
              stripeCustomerId: customer.id
            });
          }
        }

        // Attach payment method
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customer.id,
        });

        // Set as default payment method
        await stripe.customers.update(customer.id, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });

        // Create subscription
        const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price: priceId }],
          default_payment_method: paymentMethodId,
          expand: ['latest_invoice.payment_intent'],
        });

        // Determine plan from price ID
        const planMap = {
          'price_1QeXXXDeveloper': 'developer',
          'price_1QeXXXTeam': 'team', 
          'price_1QeXXXEnterprise': 'enterprise'
        };
        
        const subscriptionPlan = planMap[priceId] || 'developer';

        // Update user subscription status
        if (db) {
          await updateDoc(doc(db, 'users', userId), {
            subscriptionPlan,
            subscriptionStatus: subscription.status,
            stripeSubscriptionId: subscription.id
          });
        }

        // Create user environment if subscription is active
        if (subscription.status === 'active') {
          try {
            await resourceManager.createUserEnvironment(userId, subscriptionPlan);
          } catch (error) {
            console.error('Failed to create user environment:', error);
            // Don't fail the subscription creation
          }
        }

        return res.json({
          success: true,
          subscription: {
            id: subscription.id,
            status: subscription.status,
            plan: subscriptionPlan
          }
        });

      case 'cancel_subscription':
        const userDocCancel = await getDoc(doc(db, 'users', userId));
        if (!userDocCancel.exists() || !userDocCancel.data().stripeSubscriptionId) {
          return res.status(404).json({ error: 'No active subscription found' });
        }

        const canceledSub = await stripe.subscriptions.update(
          userDocCancel.data().stripeSubscriptionId,
          { cancel_at_period_end: true }
        );

        return res.json({
          success: true,
          subscription: {
            id: canceledSub.id,
            status: canceledSub.status,
            cancelAtPeriodEnd: canceledSub.cancel_at_period_end
          }
        });

      case 'get_usage':
        const resources = await resourceManager.getUserResources(userId);
        const planLimits = resourceManager.getPlanLimits(
          resources?.subscriptionPlan || 'free'
        );

        return res.json({
          success: true,
          usage: resources?.usage || {
            apiCalls: 0,
            sandboxHours: 0,
            deployments: 0,
            estimatedCost: 0
          },
          limits: planLimits,
          plan: resources?.subscriptionPlan || 'free'
        });

      case 'create_portal_session':
        const userDocPortal = await getDoc(doc(db, 'users', userId));
        if (!userDocPortal.exists() || !userDocPortal.data().stripeCustomerId) {
          return res.status(404).json({ error: 'No customer found' });
        }

        const portalSession = await stripe.billingPortal.sessions.create({
          customer: userDocPortal.data().stripeCustomerId,
          return_url: `${req.headers.origin}/dashboard`,
        });

        return res.json({
          success: true,
          url: portalSession.url
        });

      case 'get_pricing':
        return res.json({
          success: true,
          plans: [
            {
              id: 'free',
              name: 'Free',
              price: 0,
              features: [
                '100 API calls/month',
                '10 sandbox hours/month', 
                '1 deployment',
                'Basic GPT-20B access',
                'Community support'
              ],
              limits: resourceManager.getPlanLimits('free')
            },
            {
              id: 'developer',
              name: 'Developer Pro',
              price: 49,
              priceId: 'price_1QeXXXDeveloper',
              features: [
                '10,000 API calls/month',
                '100 sandbox hours/month',
                '10 deployments',
                'Full GPT-20B access',
                'Priority support',
                'Custom domains'
              ],
              limits: resourceManager.getPlanLimits('developer')
            },
            {
              id: 'team',
              name: 'Team',
              price: 149,
              priceId: 'price_1QeXXXTeam',
              features: [
                '100,000 API calls/month',
                '500 sandbox hours/month',
                '50 deployments',
                'GPT-20B + GPT-120B access',
                'Team collaboration',
                'Advanced analytics',
                'Priority support'
              ],
              limits: resourceManager.getPlanLimits('team')
            },
            {
              id: 'enterprise',
              name: 'Enterprise',
              price: 500,
              priceId: 'price_1QeXXXEnterprise',
              features: [
                '1M+ API calls/month',
                '2000 sandbox hours/month',
                '200 deployments',
                'All model access',
                'Dedicated support',
                'Custom integrations',
                'SLA guarantee'
              ],
              limits: resourceManager.getPlanLimits('enterprise')
            }
          ]
        });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Billing management error:', error);
    return res.status(500).json({ error: error.message });
  }
}
