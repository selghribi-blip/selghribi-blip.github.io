import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.acacia",
  typescript: true,
});

/** Pro plan: included summaries per month before overage kicks in. */
export const PRO_INCLUDED_SUMMARIES = 200;

/** Price per extra summary (in USD cents, for display only — Stripe uses unit_amount). */
export const PRO_OVERAGE_PRICE_CENTS = 5; // $0.05
