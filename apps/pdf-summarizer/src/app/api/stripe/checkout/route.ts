import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe';

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for a new subscription.
 * Requires an authenticated session.
 * Returns { url: string } to redirect the user to Stripe.
 */
export async function POST(_req: NextRequest): Promise<NextResponse> {
  const session = await getServerAuthSession();

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = await createCheckoutSession(session.user.id, session.user.email);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create checkout session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
