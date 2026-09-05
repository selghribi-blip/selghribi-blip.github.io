/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout Session for the Pro plan subscription.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe/stripe";
import { PLANS } from "@/lib/stripe/plans";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const proPlan = PLANS.find((p) => p.id === "pro")!;
    if (!proPlan.priceId) {
      return NextResponse.json({ error: "Server configuration error: missing Stripe price ID." }, { status: 500 });
    }

    const appUrl = process.env.APP_URL ?? "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: proPlan.priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=cancel`,
      customer_email: session.user.email ?? undefined,
      metadata: {
        userId: session.user.id,
        product: "pdf-contract-summarizer",
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[/api/stripe/checkout]", err);
    return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 });
  }
}
