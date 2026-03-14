import Stripe from 'stripe';
import prisma from '@/lib/prisma';

/**
 * Singleton Stripe client initialised with the secret key from environment variables.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
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
