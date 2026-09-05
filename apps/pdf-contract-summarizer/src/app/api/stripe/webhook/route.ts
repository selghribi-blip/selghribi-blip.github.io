/**
 * POST /api/stripe/webhook
 *
 * Handles incoming Stripe events to keep the DB in sync.
 * IMPORTANT: raw body is required for signature verification — do NOT add
 *            JSON body parsing middleware to this route.
 */

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/stripe";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing webhook configuration." }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ── Checkout completed → activate Pro ─────────────────────────────
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const userId = checkoutSession.metadata?.userId;
        const customerId =
          typeof checkoutSession.customer === "string"
            ? checkoutSession.customer
            : (checkoutSession.customer as Stripe.Customer | null)?.id;
        const subId =
          typeof checkoutSession.subscription === "string"
            ? checkoutSession.subscription
            : (checkoutSession.subscription as Stripe.Subscription | null)?.id;

        if (userId && customerId && subId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: "pro",
              stripeCustomerId: customerId,
              stripeSubId: subId,
              stripeSubStatus: "active",
            },
          });
        }
        break;
      }

      // ── Subscription updated ───────────────────────────────────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const status = sub.status;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            plan: status === "active" ? "pro" : "free",
            stripeSubStatus: status,
          },
        });
        break;
      }

      // ── Subscription deleted / canceled → downgrade to free ───────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            plan: "free",
            stripeSubStatus: "canceled",
          },
        });
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook] DB update failed:", err);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
