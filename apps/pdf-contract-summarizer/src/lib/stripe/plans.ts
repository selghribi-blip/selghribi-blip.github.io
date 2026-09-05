/**
 * Pro plan configuration.
 *
 * In your Stripe dashboard create:
 *   1. A recurring fixed monthly price  → STRIPE_PRICE_PRO_BASE
 *   2. A metered per-unit price         → STRIPE_PRICE_PRO_OVERAGE_METERED
 *      (unit_amount = 5, currency = usd, usage_type = metered, aggregate_usage = sum)
 *
 * Both prices must belong to the same Stripe Product.
 */
export const PLANS = {
  free: {
    name: "Free",
    summariesPerDay: 3,
    maxFileSizeBytes: 5 * 1024 * 1024, // 5 MB
    contractModeAllowed: false,
  },
  pro: {
    name: "Pro",
    summariesPerMonth: 200,
    overagePriceUsd: 0.05,
    maxFileSizeBytes: 35 * 1024 * 1024, // 35 MB
    contractModeAllowed: true,
    // Set these in .env
    basePriceId: process.env.STRIPE_PRICE_PRO_BASE ?? "",
    overagePriceId: process.env.STRIPE_PRICE_PRO_OVERAGE_METERED ?? "",
  },
} as const;

export type PlanKey = keyof typeof PLANS;
