/**
 * lib/stripe/plans.ts
 * Plan price configuration – reads from environment variables.
 */

export const STRIPE_PRICES = {
  /** Fixed monthly recurring fee for Pro plan */
  proBase: process.env.STRIPE_PRICE_PRO_BASE ?? "",
  /** Metered overage price – reported per extra summary beyond 200/month */
  proOverageMetered: process.env.STRIPE_PRICE_PRO_OVERAGE_METERED ?? "",
} as const;
