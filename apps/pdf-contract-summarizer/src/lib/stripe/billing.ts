import { db } from "@/lib/db";
import { stripe } from "./stripe";

/**
 * Report one overage unit to Stripe for a Pro user who has exceeded their 200/month quota.
 *
 * Idempotency guarantee:
 *   - We first insert an OverageUsageEvent row with a unique idempotencyKey.
 *   - If the row already exists (unique constraint), we skip the Stripe call (no duplicate billing).
 *   - After a successful Stripe call we update the row with the returned stripeRecordId.
 *
 * @param userId          Internal user ID
 * @param monthKey        "YYYY-MM" string for the current billing month (UTC)
 * @param summaryCount    Current total summary count this month (used to build a stable key)
 */
export async function reportOverageUsage(
  userId: string,
  monthKey: string,
  summaryCount: number,
): Promise<void> {
  const idempotencyKey = `${userId}:${monthKey}:${summaryCount}`;

  // Try to insert – if it already exists the unique constraint throws, which we catch and ignore.
  let event;
  try {
    event = await db.overageUsageEvent.create({
      data: { userId, idempotencyKey },
    });
  } catch {
    // Row already exists → this overage was already reported (or is in-flight). Skip.
    return;
  }

  // Fetch the subscription to get the metered subscription item ID
  const subscription = await db.subscription.findUnique({
    where: { userId },
    select: { stripeMeteredItemId: true },
  });

  if (!subscription?.stripeMeteredItemId) {
    // Cannot report without the metered item ID; skip but leave the event row so we don't retry
    return;
  }

  // Create a usage record on Stripe (quantity = 1 per overage summary)
  const usageRecord = await stripe.subscriptionItems.createUsageRecord(
    subscription.stripeMeteredItemId,
    {
      quantity: 1,
      action: "increment",
      timestamp: Math.floor(Date.now() / 1000),
    },
    {
      idempotencyKey,
    },
  );

  // Persist the Stripe record ID so we have an audit trail
  await db.overageUsageEvent.update({
    where: { id: event.id },
    data: {
      stripeRecordId: usageRecord.id,
      reportedAt: new Date(),
    },
  });
}
