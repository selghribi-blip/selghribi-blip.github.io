/**
 * lib/usage.ts
 * Server-side quota helpers.
 *
 * Responsibilities:
 *  - Increment usage counters (daily for Free, monthly for Pro).
 *  - Determine whether a user may run a new summary.
 *  - Report overage usage records to Stripe (idempotent).
 *  - Return remaining quota to callers.
 */
import { Plan, SubscriptionStatus } from "@prisma/client";
import { prisma } from "./db";
import { getUtcDayKey, getUtcMonthKey } from "./keys";
import { PLAN_LIMITS, isProActive } from "./plans";
import { stripe } from "./stripe/stripe";
import { randomUUID } from "crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UsageCheckResult {
  allowed: boolean;
  /** Reason why the summary is blocked (only set when allowed=false) */
  reason?: string;
  /** HTTP status code to return when blocked */
  statusCode?: number;
  /** Free: summaries remaining today (after this one) */
  remaining_today?: number;
  /** Pro: included summaries remaining this month (floored at 0) */
  remaining_month_included?: number;
  /** Pro: overage summaries used this month */
  overage_count_this_month?: number;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Check quota, increment counter, and (for Pro overages) report metered usage
 * to Stripe.
 *
 * This function is the single call from the /api/summarize route.
 *
 * @param userId         The authenticated user's database ID.
 * @param requestedMode  "general" | "contract"
 * @returns              UsageCheckResult – call .allowed to decide if you may proceed.
 */
export async function checkAndIncrementUsage(
  userId: string,
  requestedMode: "general" | "contract"
): Promise<UsageCheckResult> {
  // Load user with subscription info
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      plan: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
      stripeMeteredItemId: true,
    },
  });

  const proActive = isProActive(
    user.plan,
    user.subscriptionStatus,
    user.currentPeriodEnd ?? null
  );

  // ── Contract mode gate ────────────────────────────────────────────────────
  if (requestedMode === "contract" && !proActive) {
    return {
      allowed: false,
      reason: "Contract Summary mode is available on the Pro plan only. Please upgrade.",
      statusCode: 403,
    };
  }

  if (proActive) {
    return handleProUsage(userId, user.stripeMeteredItemId ?? null);
  }

  return handleFreeUsage(userId);
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function handleFreeUsage(userId: string): Promise<UsageCheckResult> {
  const dateKey = getUtcDayKey();
  const limit = PLAN_LIMITS.FREE.summariesPerDay;

  // Upsert daily counter (atomic increment via Prisma)
  const counter = await prisma.usageCounterDaily.upsert({
    where: { userId_dateKey: { userId, dateKey } },
    update: { count: { increment: 1 } },
    create: { userId, dateKey, count: 1 },
  });

  if (counter.count > limit) {
    // Rolled back conceptually – decrement to keep counter accurate
    await prisma.usageCounterDaily.update({
      where: { userId_dateKey: { userId, dateKey } },
      data: { count: { decrement: 1 } },
    });
    return {
      allowed: false,
      reason: `Free plan allows ${limit} summaries per day. You have reached today's limit. Upgrade to Pro for more.`,
      statusCode: 429,
      remaining_today: 0,
    };
  }

  return {
    allowed: true,
    remaining_today: limit - counter.count,
  };
}

async function handleProUsage(
  userId: string,
  stripeMeteredItemId: string | null
): Promise<UsageCheckResult> {
  const monthKey = getUtcMonthKey();
  const includedLimit = PLAN_LIMITS.PRO.summariesPerMonth;

  // Upsert monthly counter
  const counter = await prisma.usageCounterMonthly.upsert({
    where: { userId_monthKey: { userId, monthKey } },
    update: { count: { increment: 1 } },
    create: { userId, monthKey, count: 1 },
  });

  const isOverage = counter.count > includedLimit;

  if (isOverage) {
    // Report overage to Stripe (idempotent)
    if (stripeMeteredItemId) {
      await reportOverageToStripe(userId, monthKey, stripeMeteredItemId, counter.count);
    }

    const overageCount = counter.count - includedLimit;
    return {
      allowed: true,
      remaining_month_included: 0,
      overage_count_this_month: overageCount,
    };
  }

  return {
    allowed: true,
    remaining_month_included: includedLimit - counter.count,
    overage_count_this_month: 0,
  };
}

/**
 * Report a single overage unit to Stripe Usage Records API.
 * Uses an idempotency key (stored in DB) to prevent double-reporting on retries.
 */
async function reportOverageToStripe(
  userId: string,
  monthKey: string,
  stripeSubscriptionItemId: string,
  currentCount: number
): Promise<void> {
  // Build a deterministic idempotency key: userId + monthKey + count-position
  const idempotencyKey = `overage-${userId}-${monthKey}-${currentCount}`;

  // Skip if already reported
  const existing = await prisma.overageUsageEvent.findUnique({
    where: { idempotencyKey },
    select: { id: true },
  });
  if (existing) return;

  // Report to Stripe
  await stripe.subscriptionItems.createUsageRecord(
    stripeSubscriptionItemId,
    {
      quantity: 1,
      timestamp: "now",
      action: "increment",
    },
    { idempotencyKey }
  );

  // Persist the event to prevent future duplicates
  await prisma.overageUsageEvent.create({
    data: {
      userId,
      monthKey,
      stripeSubscriptionItemId,
      idempotencyKey,
      id: randomUUID(),
    },
  });
}
