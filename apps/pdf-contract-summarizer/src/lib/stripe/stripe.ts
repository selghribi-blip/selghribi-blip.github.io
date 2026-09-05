/**
 * lib/stripe/stripe.ts
 * Stripe SDK singleton (lazy initialization to avoid build-time errors).
 */
import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * Returns the Stripe SDK instance.
 * Throws at runtime (not build time) if the secret key is missing.
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }
  _stripe = new Stripe(key, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
  return _stripe;
}

// Convenience re-export so call sites can do either:
//   import { stripe } from "@/lib/stripe/stripe"
//   import { getStripe } from "@/lib/stripe/stripe"
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
