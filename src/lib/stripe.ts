import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Client-side Stripe instance
export const getStripe = () => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
};

// Pricing plans
export const PRICING_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      'Browse model library',
      'View documentation',
      'Community support',
    ],
    limits: {
      deployments: 0,
      apiCalls: 0,
    },
  },
  developer: {
    name: 'Developer Pro',
    price: 49,
    priceId: process.env.STRIPE_PRICE_ID_DEVELOPER,
    features: [
      'Deploy gpt-oss-20b instances',
      '10,000 API calls/month',
      'Email support',
      'Custom endpoints',
      'Basic analytics',
    ],
    limits: {
      deployments: 3,
      apiCalls: 10000,
    },
  },
  team: {
    name: 'Team',
    price: 149,
    priceId: process.env.STRIPE_PRICE_ID_TEAM,
    features: [
      'Deploy both model sizes',
      '50,000 API calls/month',
      'Priority support',
      'Team management',
      'Advanced analytics',
      'Custom domains',
    ],
    limits: {
      deployments: 10,
      apiCalls: 50000,
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: 500,
    priceId: process.env.STRIPE_PRICE_ID_ENTERPRISE,
    features: [
      'Unlimited deployments',
      '500,000 API calls/month',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantees',
      'White-label options',
    ],
    limits: {
      deployments: -1, // unlimited
      apiCalls: 500000,
    },
  },
};

export type PricingPlan = keyof typeof PRICING_PLANS;
