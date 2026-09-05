import { FREE_DAILY_LIMIT, PRO_MONTHLY_LIMIT } from "../quota";

export interface Plan {
  id: "free" | "pro";
  name: string;
  price: string;
  priceId: string;
  /** Summaries per period (day for free, month for pro) */
  limit: number;
  periodLabel: string;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    priceId: "",
    limit: FREE_DAILY_LIMIT,
    periodLabel: "per day",
    features: [
      `${FREE_DAILY_LIMIT} summaries / day`,
      "General PDF summary",
      "Up to 5 MB PDF size",
      "English & Arabic output",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9 / month",
    priceId: process.env.STRIPE_PRICE_PRO ?? "",
    limit: PRO_MONTHLY_LIMIT,
    periodLabel: "per month",
    features: [
      `${PRO_MONTHLY_LIMIT} summaries / month`,
      "General PDF summary",
      "Contract Summary mode ✨",
      "Up to 25 MB PDF size",
      "English & Arabic output",
      "Priority support",
    ],
  },
];

export function getPlan(id: "free" | "pro"): Plan {
  return PLANS.find((p) => p.id === id)!;
}
