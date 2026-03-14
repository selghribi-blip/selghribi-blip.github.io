// Stripe client singleton
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
});

// ─── Plan configuration ─────────────────────────────────────────────────────

export const PLANS = {
  free: {
    name: "Free",
    priceMonthly: 0,
    includedSummaries: 3,
    overagePerSummary: null,
    stripePriceId: null,
  },
  pro: {
    name: "Pro",
    /** Base monthly subscription: $19 */
    priceMonthly: 19,
    /** Summaries included in the base price before overage kicks in */
    includedSummaries: 200,
    /** Overage charge per summary beyond the included allowance: $0.05 */
    overagePerSummary: 0.05,
    /** Recurring fixed price ID — $19/month */
    stripePriceIdBase: process.env.STRIPE_PRICE_PRO_BASE!,
    /** Recurring metered price ID — $0.05/unit, aggregation: sum */
    stripePriceIdOverageMetered: process.env.STRIPE_PRICE_PRO_OVERAGE_METERED!,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
