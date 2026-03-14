import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe/stripe";
import { PLANS } from "@/lib/stripe/plans";
import { db } from "@/lib/db";

/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout session for the Pro plan.
 * Includes both the base recurring price and the metered overage price.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!PLANS.pro.basePriceId) {
    return NextResponse.json({ error: "Stripe Pro base price is not configured." }, { status: 500 });
  }
  if (!PLANS.pro.overagePriceId) {
    return NextResponse.json({ error: "Stripe Pro overage price is not configured." }, { status: 500 });
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const userId = session.user.id;

  // Check if user already has a Stripe customer ID
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true, name: true },
  });

  let customerId = user?.stripeCustomerId;
  if (!customerId) {
    // Create a new Stripe customer and persist it
    const customer = await stripe.customers.create({
      email: user?.email ?? undefined,
      name: user?.name ?? undefined,
      metadata: { userId },
    });
    customerId = customer.id;
    await db.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      // Fixed base price (e.g. $9/month for 200 included summaries)
      { price: PLANS.pro.basePriceId, quantity: 1 },
      // Metered overage price ($0.05 per extra summary) – no quantity for metered items
      { price: PLANS.pro.overagePriceId },
    ],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancel`,
    metadata: {
      userId,
      product: "pdf-contract-summarizer",
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
