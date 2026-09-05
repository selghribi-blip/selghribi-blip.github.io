import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe/stripe";
import {
  FREE_DAILY_LIMIT,
  FREE_MAX_PDF_BYTES,
  PRO_MAX_PDF_BYTES,
  PRO_MONTHLY_LIMIT,
} from "@/lib/stripe/plans";

/** Returns current UTC date as "YYYY-MM-DD" */
function utcDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Returns current UTC month as "YYYY-MM" */
function utcMonthString(): string {
  return new Date().toISOString().slice(0, 7);
}

export type CheckResult =
  | { allowed: true; isOverage: boolean; remaining: number | null }
  | { allowed: false; reason: string };

/**
 * Check whether a user is allowed to create a summary.
 * Also enforces file size and contract mode limits.
 * Returns remaining included quota (null when overage is active).
 */
export async function checkSummaryAllowed(
  userId: string,
  {
    fileSize,
    contractMode,
  }: { fileSize: number; contractMode: boolean }
): Promise<CheckResult> {
  // Load or create subscription record
  let sub = await db.subscription.findUnique({ where: { userId } });
  if (!sub) {
    sub = await db.subscription.create({
      data: { userId, stripeCustomerId: "", plan: "free" },
    });
  }

  const plan = sub.plan as "free" | "pro";

  // --- File size check ---
  const maxBytes = plan === "pro" ? PRO_MAX_PDF_BYTES : FREE_MAX_PDF_BYTES;
  if (fileSize > maxBytes) {
    const limitMB = maxBytes / 1024 / 1024;
    return {
      allowed: false,
      reason: `PDF exceeds the ${limitMB}MB limit for your plan.`,
    };
  }

  // --- Contract mode check ---
  if (contractMode && plan !== "pro") {
    return {
      allowed: false,
      reason: "Contract analysis mode is available on Pro only. Please upgrade.",
    };
  }

  // --- Quota check ---
  if (plan === "free") {
    const today = utcDateString();
    const count =
      sub.dailySummaryDate === today ? sub.dailySummaryCount : 0;

    if (count >= FREE_DAILY_LIMIT) {
      return {
        allowed: false,
        reason: `Free plan allows ${FREE_DAILY_LIMIT} summaries per day. You have used all of today's quota. Try again tomorrow or upgrade to Pro.`,
      };
    }
    return { allowed: true, isOverage: false, remaining: FREE_DAILY_LIMIT - count };
  }

  // Pro plan — check monthly included quota
  const currentMonth = utcMonthString();
  const periodMonth = sub.currentPeriodStart
    ? sub.currentPeriodStart.toISOString().slice(0, 7)
    : currentMonth;

  const count =
    periodMonth === currentMonth ? sub.monthlySummaryCount : 0;

  if (count < PRO_MONTHLY_LIMIT) {
    return {
      allowed: true,
      isOverage: false,
      remaining: PRO_MONTHLY_LIMIT - count,
    };
  }

  // Over the included 200 — overage billing kicks in
  return { allowed: true, isOverage: true, remaining: null };
}

/**
 * Record a completed summary:
 * - Increments the appropriate counter (daily or monthly)
 * - If overage, creates a Stripe meter event (idempotent)
 */
export async function recordSummaryUsage(
  userId: string,
  {
    fileSize,
    contractMode,
    isOverage,
  }: { fileSize: number; contractMode: boolean; isOverage: boolean }
): Promise<void> {
  // Persist summary event
  await db.summaryUsage.create({
    data: { userId, mode: contractMode ? "contract" : "general", fileSize },
  });

  const sub = await db.subscription.findUnique({ where: { userId } });
  if (!sub) return;

  if (sub.plan === "free") {
    const today = utcDateString();
    await db.subscription.update({
      where: { userId },
      data:
        sub.dailySummaryDate === today
          ? { dailySummaryCount: { increment: 1 } }
          : { dailySummaryCount: 1, dailySummaryDate: today },
    });
    return;
  }

  // Pro — increment monthly counter atomically
  const currentMonth = utcMonthString();
  const periodMonth = sub.currentPeriodStart
    ? sub.currentPeriodStart.toISOString().slice(0, 7)
    : currentMonth;
  const inSamePeriod = periodMonth === currentMonth;

  await db.subscription.update({
    where: { userId },
    data: inSamePeriod
      ? { monthlySummaryCount: { increment: 1 } }
      : { monthlySummaryCount: 1 },
  });

  if (!isOverage) return;

  // Create Stripe metered billing event (idempotent)
  if (!sub.stripeCustomerId) {
    console.warn("No stripeCustomerId for user", userId, "— skipping meter event");
    return;
  }

  const meterEventName = process.env.STRIPE_BILLING_METER_EVENT_NAME;
  if (!meterEventName) {
    console.warn("STRIPE_BILLING_METER_EVENT_NAME not configured — skipping meter event");
    return;
  }

  // Use the SummaryUsage record id for a stable, unique idempotency key
  const summaryRecord = await db.summaryUsage.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  const idempotencyKey = `overage-${userId}-${summaryRecord?.id ?? Date.now()}`;

  const existing = await db.overageUsageEvent.findUnique({
    where: { idempotencyKey },
  });
  if (existing) return; // Already billed — skip

  try {
    const meterEvent = await stripe.billing.meterEvents.create(
      {
        event_name: meterEventName,
        payload: {
          stripe_customer_id: sub.stripeCustomerId,
          value: "1",
        },
        identifier: idempotencyKey,
      }
    );

    await db.overageUsageEvent.create({
      data: {
        userId,
        idempotencyKey,
        stripeUsageRecordId: meterEvent.identifier,
        quantity: 1,
      },
    });
  } catch (err) {
    console.error("Failed to create Stripe meter event:", err);
    // Persist locally to avoid re-attempting on next request (potential false-skip)
    await db.overageUsageEvent.create({
      data: { userId, idempotencyKey, quantity: 1 },
    });
  }
}

/**
 * Get quota info for the current user to display in the UI.
 */
export async function getQuotaInfo(userId: string): Promise<{
  plan: "free" | "pro";
  remaining: number | null;
  limit: number;
  period: "day" | "month";
  isOverage: boolean;
}> {
  const sub = await db.subscription.findUnique({ where: { userId } });
  if (!sub) {
    return { plan: "free", remaining: FREE_DAILY_LIMIT, limit: FREE_DAILY_LIMIT, period: "day", isOverage: false };
  }

  if (sub.plan !== "pro") {
    const today = utcDateString();
    const count =
      sub.dailySummaryDate === today ? sub.dailySummaryCount : 0;
    return {
      plan: "free",
      remaining: Math.max(0, FREE_DAILY_LIMIT - count),
      limit: FREE_DAILY_LIMIT,
      period: "day",
      isOverage: false,
    };
  }

  const currentMonth = utcMonthString();
  const periodMonth = sub.currentPeriodStart
    ? sub.currentPeriodStart.toISOString().slice(0, 7)
    : currentMonth;
  const count =
    periodMonth === currentMonth ? sub.monthlySummaryCount : 0;

  const isOverage = count >= PRO_MONTHLY_LIMIT;
  return {
    plan: "pro",
    remaining: isOverage ? null : PRO_MONTHLY_LIMIT - count,
    limit: PRO_MONTHLY_LIMIT,
    period: "month",
    isOverage,
  };
}
