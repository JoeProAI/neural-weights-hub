import Stripe from 'stripe';
import { ResourceManager } from '../../../lib/resource-manager.js';
import { db } from '../../../lib/firebase.js';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resourceManager = new ResourceManager();

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSuccess(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handleSubscriptionChange(subscription) {
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = customer.metadata.userId;
    
    if (!userId) {
      console.error('No userId found in customer metadata');
      return;
    }

    // Determine plan from price ID
    const priceId = subscription.items.data[0].price.id;
    const planMap = {
      'price_1QeXXXDeveloper': 'developer',
      'price_1QeXXXTeam': 'team',
      'price_1QeXXXEnterprise': 'enterprise'
    };
    
    const subscriptionPlan = planMap[priceId] || 'developer';

    // Update user subscription in Firebase
    if (db) {
      await updateDoc(doc(db, 'users', userId), {
        subscriptionPlan,
        subscriptionStatus: subscription.status,
        stripeSubscriptionId: subscription.id
      });
    }

    // Create or update user environment if subscription is active
    if (subscription.status === 'active') {
      const existingResources = await resourceManager.getUserResources(userId);
      
      if (!existingResources) {
        // Create new environment
        await resourceManager.createUserEnvironment(userId, subscriptionPlan);
      } else if (existingResources.subscriptionPlan !== subscriptionPlan) {
        // Upgrade/downgrade existing environment
        await resourceManager.upgradeUserEnvironment(userId, subscriptionPlan);
      }
    }

    console.log(`Subscription updated for user ${userId}: ${subscriptionPlan} (${subscription.status})`);
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}

async function handleSubscriptionCancellation(subscription) {
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = customer.metadata.userId;
    
    if (!userId) return;

    // Update user to free plan
    if (db) {
      await updateDoc(doc(db, 'users', userId), {
        subscriptionPlan: 'free',
        subscriptionStatus: 'canceled',
        stripeSubscriptionId: null
      });
    }

    // Stop user resources to save costs
    await resourceManager.stopUserResources(userId);

    console.log(`Subscription canceled for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

async function handlePaymentSuccess(invoice) {
  try {
    const customer = await stripe.customers.retrieve(invoice.customer);
    const userId = customer.metadata.userId;
    
    if (!userId) return;

    // Reset any payment failure flags
    if (db) {
      await updateDoc(doc(db, 'users', userId), {
        paymentStatus: 'current'
      });
    }

    console.log(`Payment succeeded for user ${userId}`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(invoice) {
  try {
    const customer = await stripe.customers.retrieve(invoice.customer);
    const userId = customer.metadata.userId;
    
    if (!userId) return;

    // Mark payment as failed and potentially suspend resources
    if (db) {
      await updateDoc(doc(db, 'users', userId), {
        paymentStatus: 'past_due'
      });
    }

    // Stop resources for non-payment
    await resourceManager.stopUserResources(userId);

    console.log(`Payment failed for user ${userId} - resources suspended`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}
