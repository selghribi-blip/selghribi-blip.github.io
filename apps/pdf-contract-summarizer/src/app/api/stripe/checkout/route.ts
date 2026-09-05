/**
 * app/api/stripe/checkout/route.ts
 *
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for the Pro subscription.
 * Includes both the base recurring price and the metered overage price.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe/stripe";
import { STRIPE_PRICES } from "@/lib/stripe/plans";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!STRIPE_PRICES.proBase || !STRIPE_PRICES.proOverageMetered) {
    return NextResponse.json({ error: "Stripe prices not configured." }, { status: 500 });
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  // Retrieve or create Stripe customer
  const dbUser = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true, name: true, stripeCustomerId: true },
  });

  let customerId = dbUser.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: dbUser.email ?? undefined,
      name: dbUser.name ?? undefined,
      metadata: { userId },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      // Fixed monthly fee
      { price: STRIPE_PRICES.proBase, quantity: 1 },
      // Metered overage (no quantity – reported via Usage Records)
      { price: STRIPE_PRICES.proOverageMetered },
    ],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancel`,
    metadata: { userId },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
