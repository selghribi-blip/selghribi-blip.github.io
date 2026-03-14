import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

export const PLANS = {
  FREE: {
    name: 'Free',
    dailyLimit: parseInt(process.env.FREE_PLAN_DAILY_LIMIT ?? '5', 10),
    contractMode: false,
    price: 0,
  },
  PRO: {
    name: 'Pro',
    dailyLimit: Infinity,
    contractMode: true,
    price: 9,
    stripePriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? '',
  },
} as const;

export type PlanName = keyof typeof PLANS;
