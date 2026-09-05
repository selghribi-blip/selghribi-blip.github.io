import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe/plans";

export type PlanType = "FREE" | "PRO";

/** Safely cast a string from the DB to our PlanType. */
export function asPlan(value: string): PlanType {
  return value === "PRO" ? "PRO" : "FREE";
}

/**
 * Returns today's date in "YYYY-MM-DD" format (UTC).
 */
export function getTodayKeyUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Returns the current month in "YYYY-MM" format (UTC).
 */
export function getMonthKeyUTC(): string {
  return new Date().toISOString().slice(0, 7);
}

export type QuotaResult =
  | { allowed: false; reason: string }
  | {
      allowed: true;
      plan: "FREE" | "PRO";
      included: number;
      used: number;
      remaining: number;
      isOverage: boolean; // true when Pro user is beyond the 200 included
    };

/**
 * Check whether a user may perform a summary and return quota details.
 * Does NOT increment the counter – call incrementUsage() after the summary succeeds.
 *
 * @param userId         Internal user ID
 * @param plan           User's current plan ("FREE" | "PRO")
 * @param isContractMode Whether the user is requesting contract summarization
 */
export async function checkQuota(
  userId: string,
  plan: "FREE" | "PRO",
  isContractMode: boolean,
): Promise<QuotaResult> {
  if (plan === "FREE") {
    if (isContractMode) {
      return { allowed: false, reason: "Contract mode is available on the Pro plan only." };
    }
    const periodKey = getTodayKeyUTC();
    const counter = await db.usageCounter.findUnique({
      where: { userId_periodKey: { userId, periodKey } },
    });
    const used = counter?.count ?? 0;
    const included = PLANS.free.summariesPerDay;
    if (used >= included) {
      return {
        allowed: false,
        reason: `Free plan allows ${included} summaries per day. You've used all ${included} today. Upgrade to Pro for more.`,
      };
    }
    return { allowed: true, plan: "FREE", included, used, remaining: included - used, isOverage: false };
  }

  // PRO
  const periodKey = getMonthKeyUTC();
  const counter = await db.usageCounter.findUnique({
    where: { userId_periodKey: { userId, periodKey } },
  });
  const used = counter?.count ?? 0;
  const included = PLANS.pro.summariesPerMonth;
  const isOverage = used >= included;

  return {
    allowed: true,
    plan: "PRO",
    included,
    used,
    remaining: Math.max(0, included - used),
    isOverage,
  };
}

/**
 * Increment the usage counter for a user after a successful summary.
 * Returns the new total count for the period.
 */
export async function incrementUsage(userId: string, plan: "FREE" | "PRO"): Promise<number> {
  const periodKey = plan === "FREE" ? getTodayKeyUTC() : getMonthKeyUTC();

  const counter = await db.usageCounter.upsert({
    where: { userId_periodKey: { userId, periodKey } },
    update: { count: { increment: 1 } },
    create: { userId, periodKey, count: 1 },
  });

  return counter.count;
}
