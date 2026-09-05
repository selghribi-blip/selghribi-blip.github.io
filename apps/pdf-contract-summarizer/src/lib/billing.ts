import { stripe, PRO_INCLUDED_SUMMARIES } from "./stripe";

/**
 * Records one metered usage unit to Stripe for the given subscription item.
 *
 * Call this for every summary request beyond PRO_INCLUDED_SUMMARIES per month.
 * Stripe sums all usage records and bills `$0.05 × units` at invoice time.
 *
 * @param subscriptionItemId - The ID of the metered subscription item
 *   (the line item whose price is STRIPE_PRICE_PRO_OVERAGE_METERED).
 * @param quantity - Number of overage units to record (default: 1).
 */
export async function recordOverageUsage(
  subscriptionItemId: string,
  quantity = 1
): Promise<void> {
  await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
    quantity,
    action: "increment",
    timestamp: Math.floor(Date.now() / 1000),
  });
}

/**
 * Returns true when the user has exceeded their included summaries for the
 * current month and should be billed for overage.
 */
export function isOverage(monthlySummaryCount: number): boolean {
  return monthlySummaryCount > PRO_INCLUDED_SUMMARIES;
}
