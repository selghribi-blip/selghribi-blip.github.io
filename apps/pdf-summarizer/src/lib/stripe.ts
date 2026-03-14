import Stripe from 'stripe';
import prisma from '@/lib/prisma';

/** Cached Stripe instance — created on first use to avoid build-time errors. */
let _stripe: Stripe | null = null;

/**
 * Returns the singleton Stripe client, creating it on the first call.
 * Using a getter prevents errors when STRIPE_SECRET_KEY is not set at build time.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    });
  }
  return _stripe;
}

/** Convenience export so existing callers can still do `stripe.customers.create(...)` */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/**
 * Looks up an existing Stripe customer for the user, or creates one if none exists.
 * Persists the stripeCustomerId in the Subscription record.
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string
): Promise<string> {
  // Check if a customer ID is already stored
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  });

  if (subscription?.stripeCustomerId) {
    return subscription.stripeCustomerId;
  }

  // Create a new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  // Persist the new customer ID
  await prisma.subscription.upsert({
    where: { userId },
    update: { stripeCustomerId: customer.id },
    create: { userId, stripeCustomerId: customer.id },
  });

  return customer.id;
}

/**
 * Creates a Stripe Checkout session for a new subscription.
 * Returns the session URL to redirect the user to.
 */
export async function createCheckoutSession(
  userId: string,
  userEmail: string
): Promise<string> {
  const customerId = await getOrCreateStripeCustomer(userId, userEmail);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID ?? '',
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/dashboard?success=true`,
    cancel_url: `${appUrl}/pricing`,
    metadata: { userId },
  });

  return session.url ?? `${appUrl}/pricing`;
}

/**
 * Creates a Stripe Billing Portal session so the user can manage their subscription.
 * Returns the portal URL.
 */
export async function createPortalSession(
  stripeCustomerId: string
): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${appUrl}/dashboard`,
  });

  return session.url;
}
