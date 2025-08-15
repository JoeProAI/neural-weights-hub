import { verifyIdToken } from '../../../lib/auth';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const stripeCustomerId = userData.stripeCustomerId;

    if (!stripeCustomerId) {
      return res.status(200).json({
        plan: 'free',
        status: 'active',
        usage: {
          apiCalls: userData.usage?.apiCalls || 0,
          sandboxHours: userData.usage?.sandboxHours || 0,
          storageGB: userData.usage?.storageGB || 0,
          estimatedCost: 0
        },
        limits: {
          apiCalls: 100,
          sandboxHours: 5,
          storageGB: 1,
          gptModels: ['gpt-20b']
        }
      });
    }

    // Get Stripe subscription info
    const customer = await stripe.customers.retrieve(stripeCustomerId);
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1
    });

    const subscription = subscriptions.data[0];
    const plan = userData.subscriptionPlan || 'free';

    // Define plan limits (realistic Daytona constraints)
    const planLimits = {
      'free': {
        apiCalls: 100,
        sandboxHours: 5,
        storageGB: 10, // Daytona disk limit
        gptModels: ['gpt-20b'],
        resources: '1 CPU, 1GB RAM, 10GB disk'
      },
      'pro': {
        apiCalls: 10000,
        sandboxHours: 100,
        storageGB: 10, // Daytona disk limit
        gptModels: ['gpt-20b', 'gpt-120b'],
        resources: '2 CPU, 4GB RAM, 10GB disk'
      },
      'team': {
        apiCalls: 50000,
        sandboxHours: 500,
        storageGB: 10, // Daytona disk limit
        gptModels: ['gpt-20b', 'gpt-120b'],
        resources: '4 CPU, 8GB RAM, 10GB disk (max)'
      },
      'enterprise': {
        apiCalls: -1, // unlimited
        sandboxHours: -1,
        storageGB: 10, // Daytona disk limit
        gptModels: ['gpt-20b', 'gpt-120b'],
        resources: '4 CPU, 8GB RAM, 10GB disk (max)'
      }
    };

    res.status(200).json({
      plan,
      status: subscription?.status || 'active',
      currentPeriodEnd: subscription?.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
      usage: {
        apiCalls: userData.usage?.apiCalls || 0,
        sandboxHours: userData.usage?.sandboxHours || 0,
        storageGB: userData.usage?.storageGB || 0,
        estimatedCost: userData.usage?.estimatedCost || 0
      },
      limits: planLimits[plan] || planLimits['free'],
      billingPortalUrl: subscription ? await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      }).then(session => session.url) : null
    });

  } catch (error) {
    console.error('Billing API error:', error);
    
    // Handle Firestore offline errors gracefully
    if (error.message.includes('offline') || error.message.includes('client is offline')) {
      return res.status(200).json({
        success: true,
        plan: 'free',
        usage: {
          apiCalls: 0,
          sandboxHours: 0,
          deployments: 0,
          estimatedCost: 0
        },
        limits: {
          apiCalls: 100,
          sandboxHours: 10,
          deployments: 1,
          cpu: 1,
          memory: 2,
          disk: 5,
          autoStop: 3600
        },
        status: 'active',
        note: 'Demo billing data (Firestore reconnecting)'
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to get billing information',
      details: error.message
    });
  }
}
