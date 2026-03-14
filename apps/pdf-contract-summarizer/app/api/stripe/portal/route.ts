import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe/stripe";
import { db } from "@/lib/db";

/**
 * POST /api/stripe/portal
 * Creates a Stripe Billing Portal session for the authenticated user.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const userId = session.user.id;
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  const sub = await db.subscription.findUnique({ where: { userId } });
  if (!sub?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No active subscription found." },
      { status: 404 }
    );
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${appUrl}/dashboard`,
  });

  return NextResponse.json({ url: portalSession.url });
}
