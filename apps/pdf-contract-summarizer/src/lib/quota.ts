/**
 * Quota enforcement for PDF & Contract Summarizer
 *
 * Plans and limits:
 *  - Free : 3 summaries per day  (period = UTC date  "YYYY-MM-DD")
 *  - Pro  : 200 summaries per month (period = UTC month "YYYY-MM")
 *
 * A single UsageRecord row is kept per (userId, planType, period).
 * The count is incremented atomically so concurrent requests are safe.
 */

import { prisma } from "./db";

// ── Constants ─────────────────────────────────────────────────────────────────

export const FREE_DAILY_LIMIT = 3;
export const PRO_MONTHLY_LIMIT = 200;

// ── Period helpers ────────────────────────────────────────────────────────────

/** Returns the current UTC date string: "YYYY-MM-DD" */
export function currentDayPeriod(): string {
  return new Date().toISOString().split("T")[0];
}

/** Returns the current UTC month string: "YYYY-MM" */
export function currentMonthPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

/** Returns the appropriate period key for the given plan. */
export function getPeriodForPlan(plan: "free" | "pro"): string {
  return plan === "pro" ? currentMonthPeriod() : currentDayPeriod();
}

// ── Quota types ───────────────────────────────────────────────────────────────

export interface QuotaStatus {
  /** Plan in use ("free" | "pro") */
  plan: "free" | "pro";
  /** Current period identifier */
  period: string;
  /** Summaries already used in this period */
  used: number;
  /** Maximum summaries allowed in this period */
  limit: number;
  /** Summaries still available (0 when exhausted) */
  remaining: number;
  /** true when the quota is exhausted */
  exceeded: boolean;
}

// ── Read current quota ────────────────────────────────────────────────────────

/**
 * Returns the current quota status for a user.
 * Does NOT modify the database.
 */
export async function getQuotaStatus(userId: string, plan: "free" | "pro"): Promise<QuotaStatus> {
  const period = getPeriodForPlan(plan);
  const limit = plan === "pro" ? PRO_MONTHLY_LIMIT : FREE_DAILY_LIMIT;

  const record = await prisma.usageRecord.findUnique({
    where: { userId_planType_period: { userId, planType: plan, period } },
    select: { count: true },
  });

  const used = record?.count ?? 0;
  const remaining = Math.max(0, limit - used);

  return {
    plan,
    period,
    used,
    limit,
    remaining,
    exceeded: used >= limit,
  };
}

// ── Check and increment ───────────────────────────────────────────────────────

/**
 * Checks whether the user can make one more summary request and, if allowed,
 * increments the counter.
 *
 * Returns the updated QuotaStatus.
 * Throws a QuotaExceededError when the limit is reached.
 */
export async function checkAndIncrementQuota(
  userId: string,
  plan: "free" | "pro"
): Promise<QuotaStatus> {
  const period = getPeriodForPlan(plan);
  const limit = plan === "pro" ? PRO_MONTHLY_LIMIT : FREE_DAILY_LIMIT;

  // Use an upsert to create or increment atomically.
  // We fetch the record AFTER the increment so we can check the new count.
  const record = await prisma.usageRecord.upsert({
    where: { userId_planType_period: { userId, planType: plan, period } },
    create: { userId, planType: plan, period, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });

  const used = record.count;

  // If the count AFTER the increment exceeds the limit, roll it back and throw.
  if (used > limit) {
    // Decrement back so we don't permanently over-count.
    await prisma.usageRecord.update({
      where: { userId_planType_period: { userId, planType: plan, period } },
      data: { count: { decrement: 1 } },
    });

    const remaining = 0;
    throw new QuotaExceededError(plan, limit, period, remaining);
  }

  const remaining = Math.max(0, limit - used);

  return {
    plan,
    period,
    used,
    limit,
    remaining,
    exceeded: false,
  };
}

// ── Error ─────────────────────────────────────────────────────────────────────

export class QuotaExceededError extends Error {
  readonly plan: "free" | "pro";
  readonly limit: number;
  readonly period: string;
  readonly remaining: number;

  constructor(plan: "free" | "pro", limit: number, period: string, remaining: number) {
    super(
      plan === "pro"
        ? `Pro plan limit reached: you have used all ${limit} summaries for this month (${period}). Please wait until next month.`
        : `Free plan limit reached: you have used all ${limit} summaries for today (${period}). Upgrade to Pro for 200 summaries/month.`
    );
    this.name = "QuotaExceededError";
    this.plan = plan;
    this.limit = limit;
    this.period = period;
    this.remaining = remaining;
  }
}
