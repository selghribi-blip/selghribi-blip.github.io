import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout Session for the Pro plan.
 * The session includes TWO line items:
 *   1. Pro Base  — STRIPE_PRICE_PRO_BASE         ($19/month recurring fixed)
 *   2. Pro Overage — STRIPE_PRICE_PRO_OVERAGE_METERED ($0.05/unit metered, billed in arrears)
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const priceProBase = process.env.STRIPE_PRICE_PRO_BASE;
  const priceProOverageMetered = process.env.STRIPE_PRICE_PRO_OVERAGE_METERED;

  if (!priceProBase || !priceProOverageMetered) {
    console.error(
      "Missing Stripe price env vars: STRIPE_PRICE_PRO_BASE or STRIPE_PRICE_PRO_OVERAGE_METERED"
    );
    return NextResponse.json(
      { error: "Stripe prices not configured" },
      { status: 500 }
    );
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: session.user.email,
    line_items: [
      {
        // Pro Base: flat $19/month recurring charge
        price: priceProBase,
        quantity: 1,
      },
      {
        // Pro Overage: metered $0.05/unit — no quantity set for metered prices
        price: priceProOverageMetered,
      },
    ],
    subscription_data: {
      metadata: {
        userEmail: session.user.email,
      },
    },
    success_url: `${appUrl}/dashboard?upgrade=success`,
    cancel_url: `${appUrl}/pricing?upgrade=cancelled`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
