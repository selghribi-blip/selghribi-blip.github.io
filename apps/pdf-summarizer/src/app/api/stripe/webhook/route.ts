import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import { SubscriptionStatus, type SubscriptionStatusType } from '@/types';
import type Stripe from 'stripe';

// Use Node.js runtime so we can read the raw request body for Stripe signature verification
export const runtime = 'nodejs';

/**
 * Maps a Stripe subscription status string to our SubscriptionStatus enum.
 */
function mapStripeStatus(status: Stripe.Subscription['status']): SubscriptionStatusType {
  switch (status) {
    case 'active':
      return SubscriptionStatus.ACTIVE;
    case 'canceled':
      return SubscriptionStatus.CANCELED;
    case 'past_due':
      return SubscriptionStatus.PAST_DUE;
    case 'trialing':
      return SubscriptionStatus.TRIALING;
    default:
      return SubscriptionStatus.INACTIVE;
  }
}

/**
 * POST /api/stripe/webhook
 * Handles incoming Stripe webhook events.
 * Verifies the Stripe signature before processing any event.
 * No user authentication — Stripe calls this endpoint directly.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // Read raw body as text for signature verification
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed';
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  // Process events synchronously
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        // Link the Stripe customer to the internal user record
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const userId = checkoutSession.metadata?.userId;
        const customerId =
          typeof checkoutSession.customer === 'string'
            ? checkoutSession.customer
            : checkoutSession.customer?.id;

        if (userId && customerId) {
          await prisma.subscription.upsert({
            where: { userId },
            update: { stripeCustomerId: customerId },
            create: { userId, stripeCustomerId: customerId },
          });
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        // Upsert the subscription record with the latest status and period end
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

        const dbSub = await prisma.subscription.findUnique({
          where: { stripeCustomerId: customerId },
          select: { userId: true },
        });

        if (dbSub?.userId) {
          await prisma.subscription.update({
            where: { userId: dbSub.userId },
            data: {
              stripeSubscriptionId: sub.id,
              stripePriceId: sub.items.data[0]?.price.id ?? null,
              status: mapStripeStatus(sub.status),
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        // Mark the subscription as canceled
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

        const dbSub = await prisma.subscription.findUnique({
          where: { stripeCustomerId: customerId },
          select: { userId: true },
        });

        if (dbSub?.userId) {
          await prisma.subscription.update({
            where: { userId: dbSub.userId },
            data: { status: SubscriptionStatus.CANCELED },
          });
        }
        break;
      }

      default:
        // Unhandled event types are ignored
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error processing webhook';
    console.error('Stripe webhook processing error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
