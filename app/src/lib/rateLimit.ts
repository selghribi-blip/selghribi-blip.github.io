/**
 * Simple in-memory rate limiter for free-plan users.
 *
 * In production, replace with a persistent store (Redis, database, etc.)
 * keyed by user ID so limits survive server restarts.
 */

interface UsageRecord {
  count: number;
  resetAt: number; // Unix ms timestamp for next reset (midnight UTC)
}

const usageMap = new Map<string, UsageRecord>();

function getMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return midnight.getTime();
}

/**
 * Returns the number of summaries the user has used today and whether they
 * are within the provided daily limit.
 */
export function checkRateLimit(
  userId: string,
  dailyLimit: number
): { allowed: boolean; used: number; limit: number; resetAt: number } {
  const now = Date.now();
  let record = usageMap.get(userId);

  if (!record || now >= record.resetAt) {
    record = { count: 0, resetAt: getMidnightUTC() };
    usageMap.set(userId, record);
  }

  const allowed = record.count < dailyLimit;
  return { allowed, used: record.count, limit: dailyLimit, resetAt: record.resetAt };
}

/**
 * Increments the usage counter for the user.
 * Call this only after a successful summary to avoid penalising failed requests.
 */
export function incrementUsage(userId: string): void {
  const now = Date.now();
  let record = usageMap.get(userId);

  if (!record || now >= record.resetAt) {
    record = { count: 0, resetAt: getMidnightUTC() };
  }

  record.count += 1;
  usageMap.set(userId, record);
}
