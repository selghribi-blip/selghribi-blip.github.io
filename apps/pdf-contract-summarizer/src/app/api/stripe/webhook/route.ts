/**
 * app/api/stripe/webhook/route.ts
 *
 * Handles Stripe webhook events to keep the DB in sync with subscription state.
 * The raw request body must NOT be parsed by Next.js before signature verification.
 */
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/stripe";
import { prisma } from "@/lib/db";
import { Plan, SubscriptionStatus } from "@prisma/client";

// Disable Next.js body parsing – Stripe needs the raw bytes for signature verification
export const config = { api: { bodyParser: false } };

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ error: "Missing webhook configuration." }, { status: 400 });
  }

  // Read raw body as text for signature verification
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return NextResponse.json({ error: "Webhook signature verification failed." }, { status: 400 });
  }

  try {
    await handleEvent(event);
  } catch (err) {
    console.error("Webhook handler error:", err);
    // Return 200 to prevent Stripe retrying indefinitely for non-signature errors
    return NextResponse.json({ error: "Internal handler error." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ─── Event handlers ───────────────────────────────────────────────────────────

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription) {
        await syncSubscription(session.subscription as string);
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      await syncSubscription(sub.id);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(sub);
      break;
    }

    default:
      // Ignore other events
      break;
  }
}

/**
 * Fetches the latest subscription state from Stripe and writes it to the DB.
 * Also extracts the stripeMeteredItemId for overage billing.
 */
async function syncSubscription(subscriptionId: string): Promise<void> {
  const sub = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"],
  });

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  // Find the user by Stripe customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });

  if (!user) {
    console.warn(`No user found for Stripe customer ${customerId}`);
    return;
  }

  // Identify which subscription item is for the metered overage price
  const meteredItemId = findMeteredItemId(sub);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: Plan.PRO,
      subscriptionStatus: mapStatus(sub.status),
      stripeSubscriptionId: sub.id,
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      stripeMeteredItemId: meteredItemId ?? undefined,
    },
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });

  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: Plan.FREE,
      subscriptionStatus: SubscriptionStatus.CANCELED,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      stripeMeteredItemId: null,
    },
  });
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Find the subscription item ID for the metered overage price.
 * Matches by comparing price IDs against STRIPE_PRICE_PRO_OVERAGE_METERED.
 */
function findMeteredItemId(sub: Stripe.Subscription): string | null {
  const overagePriceId = process.env.STRIPE_PRICE_PRO_OVERAGE_METERED;
  if (!overagePriceId) return null;

  for (const item of sub.items.data) {
    const price = item.price as Stripe.Price;
    if (price.id === overagePriceId) {
      return item.id;
    }
  }
  return null;
}

/** Maps Stripe subscription status to the DB enum. */
function mapStatus(stripeStatus: Stripe.Subscription["status"]): SubscriptionStatus {
  const map: Record<string, SubscriptionStatus> = {
    active: SubscriptionStatus.ACTIVE,
    past_due: SubscriptionStatus.PAST_DUE,
    canceled: SubscriptionStatus.CANCELED,
    trialing: SubscriptionStatus.TRIALING,
    incomplete: SubscriptionStatus.INCOMPLETE,
    incomplete_expired: SubscriptionStatus.INCOMPLETE_EXPIRED,
    unpaid: SubscriptionStatus.UNPAID,
  };
  return map[stripeStatus] ?? SubscriptionStatus.ACTIVE;
}
