// POST /api/stripe/checkout
// Creates a Stripe Checkout Session for the Pro plan.
// The session includes BOTH the base ($19/month fixed) and the overage
// ($0.05/unit metered) price IDs so Stripe can bill both components.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe, PLANS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, stripeCustomerId: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Ensure required env vars are present before creating session
  if (!PLANS.pro.stripePriceIdBase) {
    throw new Error("Missing STRIPE_PRICE_PRO_BASE environment variable");
  }
  if (!PLANS.pro.stripePriceIdOverageMetered) {
    throw new Error(
      "Missing STRIPE_PRICE_PRO_OVERAGE_METERED environment variable"
    );
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: user.stripeCustomerId ?? undefined,
    customer_email: user.stripeCustomerId ? undefined : (user.email ?? undefined),
    // Include BOTH prices:
    //  1. Pro Base   — $19/month fixed recurring
    //  2. Pro Overage — $0.05/unit metered recurring (sum aggregation)
    line_items: [
      {
        price: PLANS.pro.stripePriceIdBase,
        quantity: 1,
      },
      {
        // Metered prices do not require an explicit quantity;
        // usage is reported later via the usage-record API.
        price: PLANS.pro.stripePriceIdOverageMetered,
      },
    ],
    subscription_data: {
      metadata: { userId: session.user.id },
    },
    success_url: `${baseUrl}/dashboard?upgraded=true`,
    cancel_url: `${baseUrl}/pricing`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
