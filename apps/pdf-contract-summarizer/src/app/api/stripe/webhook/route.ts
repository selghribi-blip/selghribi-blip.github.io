import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/stripe";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe/plans";

/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events to keep the database in sync.
 *
 * Key responsibilities:
 *  - checkout.session.completed   → persist subscription + stripeMeteredItemId, set plan = PRO
 *  - customer.subscription.updated → update subscription status, re-sync stripeMeteredItemId
 *  - customer.subscription.deleted → mark subscription canceled, downgrade plan to FREE
 *
 * IMPORTANT: This route MUST receive the raw request body for signature verification.
 * Next.js App Router returns raw bodies in Route Handlers by default.
 */
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
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") break;

      const userId = session.metadata?.userId;
      if (!userId) {
        console.error("[webhook] checkout.session.completed: missing userId in metadata");
        break;
      }

      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;

      // Fetch full subscription to extract line items
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["items.data.price"],
      });

      // Find the metered item (overage price) among the subscription items
      const meteredItem = subscription.items.data.find(
        (item) => item.price.id === PLANS.pro.overagePriceId,
      );

      const periodStart = new Date(subscription.current_period_start * 1000);
      const periodEnd = new Date(subscription.current_period_end * 1000);

      await db.$transaction([
        // Update Stripe customer ID on user
        db.user.update({
          where: { id: userId },
          data: { stripeCustomerId: customerId, plan: "PRO" },
        }),
        // Upsert subscription record with stripeMeteredItemId
        db.subscription.upsert({
          where: { userId },
          create: {
            userId,
            stripeSubscriptionId: subscriptionId,
            stripeMeteredItemId: meteredItem?.id ?? null,
            status: subscription.status,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
          },
          update: {
            stripeSubscriptionId: subscriptionId,
            stripeMeteredItemId: meteredItem?.id ?? null,
            status: subscription.status,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
          },
        }),
      ]);

      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;

      const sub = await db.subscription.findUnique({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (!sub) break;

      // Re-fetch with expanded items in case the metered item changed
      const fullSub = await stripe.subscriptions.retrieve(subscription.id, {
        expand: ["items.data.price"],
      });

      const meteredItem = fullSub.items.data.find(
        (item) => item.price.id === PLANS.pro.overagePriceId,
      );

      const periodStart = new Date(subscription.current_period_start * 1000);
      const periodEnd = new Date(subscription.current_period_end * 1000);

      await db.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          stripeMeteredItemId: meteredItem?.id ?? null,
          status: subscription.status,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      });

      // Downgrade to FREE if subscription is no longer active
      if (subscription.status !== "active" && subscription.status !== "trialing") {
        await db.user.update({
          where: { id: sub.userId },
          data: { plan: "FREE" },
        });
      } else {
        await db.user.update({
          where: { id: sub.userId },
          data: { plan: "PRO" },
        });
      }

      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;

      const sub = await db.subscription.findUnique({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (!sub) break;

      await db.$transaction([
        db.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: { status: "canceled" },
        }),
        db.user.update({
          where: { id: sub.userId },
          data: { plan: "FREE" },
        }),
      ]);

      break;
    }

    default:
      // Unhandled event types are safe to ignore
      break;
  }

  return NextResponse.json({ received: true });
}
