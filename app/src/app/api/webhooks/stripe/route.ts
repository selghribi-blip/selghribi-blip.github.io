import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events.
 *
 * Register this endpoint in your Stripe Dashboard:
 *   https://dashboard.stripe.com/webhooks
 * Endpoint URL: https://app.artsmoroccan.me/api/webhooks/stripe
 *
 * Events to listen for:
 *   - customer.subscription.created
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 *   - checkout.session.completed
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Missing STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle subscription lifecycle events
  switch (event.type) {
    case 'checkout.session.completed': {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      console.log(
        `Checkout completed for customer ${checkoutSession.customer}, metadata:`,
        checkoutSession.metadata
      );
      // TODO: persist subscription status to your database
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(
        `Subscription ${event.type} for customer ${subscription.customer}: status=${subscription.status}`
      );
      // TODO: update user's plan in your database
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`Subscription deleted for customer ${subscription.customer}`);
      // TODO: downgrade user to FREE in your database
      break;
    }

    default:
      // Unhandled event type – this is fine
      break;
  }

  return NextResponse.json({ received: true });
}
