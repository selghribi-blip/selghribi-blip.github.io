import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { createPortalSession } from '@/lib/stripe';
import prisma from '@/lib/prisma';

/**
 * POST /api/stripe/portal
 * Creates a Stripe Billing Portal session so the user can manage their subscription.
 * The user must already have a stripeCustomerId stored in the database.
 * Returns { url: string }.
 */
export async function POST(_req: NextRequest): Promise<NextResponse> {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Look up the user's Stripe customer ID
  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!subscription?.stripeCustomerId) {
    return NextResponse.json(
      { error: 'No Stripe customer found. Please subscribe first.' },
      { status: 400 }
    );
  }

  try {
    const url = await createPortalSession(subscription.stripeCustomerId);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create portal session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
