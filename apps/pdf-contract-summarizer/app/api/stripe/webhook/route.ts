import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/stripe";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe events to keep the local database in sync.
 * Key events:
 *   - checkout.session.completed    — provision Pro subscription
 *   - customer.subscription.updated — sync status & overage item id
 *   - customer.subscription.deleted — downgrade to free
 *   - invoice.payment_failed        — mark subscription as past_due
 *
 * IMPORTANT: Must use raw body for signature verification.
 * Add this route to next.config.ts as a bodyParser-excluded path.
 */
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing webhook configuration." },
      { status: 400 }
    );
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      if (checkoutSession.mode !== "subscription") break;

      const userId = checkoutSession.metadata?.userId;
      if (!userId) break;

      const subscriptionId = checkoutSession.subscription as string;
      const customerId = checkoutSession.customer as string;

      // Fetch full subscription to find the metered item id
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const overageItemId = findOverageItemId(subscription);
      const periodInfo = getPeriodFromSubscription(subscription);

      await upsertSubscription({
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripeOverageItemId: overageItemId,
        plan: "pro",
        status: subscription.status,
        currentPeriodStart: periodInfo.currentPeriodStart,
        currentPeriodEnd: periodInfo.currentPeriodEnd,
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (!userId) break;

      const overageItemId = findOverageItemId(subscription);
      const periodInfo = getPeriodFromSubscription(subscription);
      const plan =
        subscription.status === "active" || subscription.status === "trialing"
          ? "pro"
          : "free";

      await upsertSubscription({
        userId,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        stripeOverageItemId: overageItemId,
        plan,
        status: subscription.status,
        currentPeriodStart: periodInfo.currentPeriodStart,
        currentPeriodEnd: periodInfo.currentPeriodEnd,
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (!userId) break;

      await db.subscription.updateMany({
        where: { userId },
        data: {
          plan: "free",
          status: "canceled",
          stripeOverageItemId: null,
        },
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = extractSubscriptionId(invoice);
      if (!subscriptionId) break;

      await db.subscription.updateMany({
        where: { stripeSubscriptionId: subscriptionId },
        data: { status: "past_due" },
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

/**
 * Extract the subscription ID from a Stripe Invoice.
 * In Stripe v20+, subscription is in parent.subscription_details.subscription.
 */
function extractSubscriptionId(invoice: Stripe.Invoice): string | null {
  if (invoice.parent?.type !== "subscription_details") return null;
  const sub = invoice.parent.subscription_details?.subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

/**
 * Get billing period dates from a subscription.
 * In Stripe v20+, current_period_start/end is on the subscription item, not the subscription.
 * Falls back to billing_cycle_anchor if no items have period info.
 */
function getPeriodFromSubscription(subscription: Stripe.Subscription): {
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
} {
  // Try first item (the base price item)
  const firstItem = subscription.items.data[0];
  if (firstItem?.current_period_start && firstItem?.current_period_end) {
    return {
      currentPeriodStart: new Date(firstItem.current_period_start * 1000),
      currentPeriodEnd: new Date(firstItem.current_period_end * 1000),
    };
  }
  // Fallback: use billing_cycle_anchor and the subscription's billing interval
  const anchorMs = subscription.billing_cycle_anchor * 1000;
  // Get period length from first item's price interval
  const firstItemInterval = subscription.items.data[0]?.price?.recurring?.interval;
  const intervalDays =
    firstItemInterval === "year"
      ? 365
      : firstItemInterval === "week"
        ? 7
        : firstItemInterval === "day"
          ? 1
          : 30; // default to monthly
  return {
    currentPeriodStart: new Date(anchorMs),
    currentPeriodEnd: new Date(anchorMs + intervalDays * 24 * 60 * 60 * 1000),
  };
}

/**
 * Find the metered (overage) subscription item id from a Stripe subscription.
 * The overage price is identified by usage_type = "metered".
 */
function findOverageItemId(subscription: Stripe.Subscription): string | null {
  for (const item of subscription.items.data) {
    const price = item.price;
    if (price.recurring?.usage_type === "metered") {
      return item.id;
    }
  }
  return null;
}

async function upsertSubscription(data: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripeOverageItemId: string | null;
  plan: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}) {
  const existing = await db.subscription.findUnique({
    where: { userId: data.userId },
  });

  // Reset monthly counter when a new billing period starts
  const resetCounter =
    existing &&
    existing.currentPeriodStart &&
    existing.currentPeriodStart.getTime() !== data.currentPeriodStart.getTime();

  if (existing) {
    await db.subscription.update({
      where: { userId: data.userId },
      data: {
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        stripeOverageItemId: data.stripeOverageItemId,
        plan: data.plan,
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        ...(resetCounter ? { monthlySummaryCount: 0 } : {}),
      },
    });
  } else {
    await db.subscription.create({
      data: {
        userId: data.userId,
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        stripeOverageItemId: data.stripeOverageItemId,
        plan: data.plan,
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
      },
    });
  }
}
