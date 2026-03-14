import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe/stripe";
import { PLANS } from "@/lib/stripe/plans";
import { db } from "@/lib/db";

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for the Pro subscription.
 * The session includes:
 *   - A fixed base recurring price (STRIPE_PRICE_PRO_BASE)
 *   - A metered overage price (STRIPE_PRICE_PRO_OVERAGE_METERED)
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const userId = session.user.id;
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  const { basePriceId, overagePriceId } = PLANS.pro;
  if (!basePriceId || !overagePriceId) {
    return NextResponse.json(
      { error: "Stripe prices not configured. Contact support." },
      { status: 500 }
    );
  }

  // Re-use existing Stripe customer if available
  const sub = await db.subscription.findUnique({ where: { userId } });
  const existingCustomerId = sub?.stripeCustomerId || undefined;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: existingCustomerId || undefined,
    customer_email: existingCustomerId ? undefined : session.user.email ?? undefined,
    line_items: [
      {
        price: basePriceId,
        quantity: 1,
      },
      {
        price: overagePriceId,
        // metered prices do not take a quantity here
      },
    ],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancel`,
    metadata: {
      userId,
      product: "pdf-contract-summarizer",
    },
    subscription_data: {
      metadata: { userId },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
