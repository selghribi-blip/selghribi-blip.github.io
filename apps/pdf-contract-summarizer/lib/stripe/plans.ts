export const FREE_DAILY_LIMIT = 3;
export const PRO_MONTHLY_LIMIT = 200;

/** 5MB for Free plan */
export const FREE_MAX_PDF_BYTES = 5 * 1024 * 1024;

/** 35MB for Pro plan */
export const PRO_MAX_PDF_BYTES = 35 * 1024 * 1024;

/** Overage cost per summary request (for display only — billed via Stripe meter) */
export const OVERAGE_COST_USD = 0.05;

export const PLANS = {
  pro: {
    name: "Pro",
    /** Fixed monthly base price ID (create in Stripe Dashboard) */
    basePriceId: process.env.STRIPE_PRICE_PRO_BASE ?? "",
    /** Metered overage price ID — $0.05 per extra summary (create in Stripe Dashboard) */
    overagePriceId: process.env.STRIPE_PRICE_PRO_OVERAGE_METERED ?? "",
  },
};
