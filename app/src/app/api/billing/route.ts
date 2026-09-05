import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { stripe, PLANS } from '@/lib/stripe';

/**
 * POST /api/billing/checkout
 * Creates a Stripe Checkout session to upgrade to Pro.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appUrl = process.env.NEXTAUTH_URL ?? 'https://app.artsmoroccan.me';

  try {
    // Find or create a Stripe customer for this user
    const existingCustomers = await stripe.customers.list({
      email: session.user.email,
      limit: 1,
    });

    const customerId =
      existingCustomers.data.length > 0
        ? existingCustomers.data[0].id
        : (
            await stripe.customers.create({
              email: session.user.email,
              name: session.user.name ?? undefined,
            })
          ).id;

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PLANS.PRO.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard?upgrade=success`,
      cancel_url: `${appUrl}/pricing?upgrade=cancelled`,
      metadata: {
        userId: (session.user as { id?: string }).id ?? session.user.email,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}

/**
 * DELETE /api/billing
 * Cancels the user's active Pro subscription at period end.
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const customers = await stripe.customers.list({
      email: session.user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const cancelled = await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({
      message: 'Subscription will be cancelled at the end of the current billing period',
      cancelAt: cancelled.cancel_at,
    });
  } catch (err) {
    console.error('Stripe cancellation error:', err);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
