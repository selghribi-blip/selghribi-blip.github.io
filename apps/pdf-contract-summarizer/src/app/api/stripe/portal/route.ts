import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe/stripe";
import { db } from "@/lib/db";

/**
 * POST /api/stripe/portal
 *
 * Redirects the authenticated user to their Stripe Billing Portal.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account found. Please subscribe first." },
      { status: 404 },
    );
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl}/dashboard`,
  });

  return NextResponse.json({ url: portalSession.url });
}
