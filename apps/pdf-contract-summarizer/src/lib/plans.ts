/**
 * lib/plans.ts
 * Plan limits and helper to derive user plan state.
 */
import { Plan } from "@prisma/client";

export const PLAN_LIMITS = {
  FREE: {
    summariesPerDay: 3,
    maxFileSizeBytes: 5 * 1024 * 1024, // 5 MB
    contractModeAllowed: false,
  },
  PRO: {
    summariesPerMonth: 200,
    maxFileSizeBytes: 35 * 1024 * 1024, // 35 MB
    contractModeAllowed: true,
  },
} as const;

/** Returns true when the user's Pro subscription is considered active. */
export function isProActive(
  plan: Plan,
  subscriptionStatus: string,
  currentPeriodEnd: Date | null
): boolean {
  if (plan !== Plan.PRO) return false;
  const activeStatuses = new Set(["ACTIVE", "TRIALING"]);
  if (!activeStatuses.has(subscriptionStatus)) return false;
  if (currentPeriodEnd && currentPeriodEnd < new Date()) return false;
  return true;
}
