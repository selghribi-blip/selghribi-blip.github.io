/**
 * POST /api/stripe/portal
 * Redirects the user to the Stripe Customer Portal to manage their subscription.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe/stripe";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No active subscription found. Please subscribe to Pro first." },
        { status: 400 }
      );
    }

    const appUrl = process.env.APP_URL ?? "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/dashboard`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("[/api/stripe/portal]", err);
    return NextResponse.json({ error: "Failed to create billing portal session." }, { status: 500 });
  }
}
