/**
 * lib/keys.ts
 * Helpers to derive UTC-based date/month keys used in usage counters.
 */

/**
 * Returns UTC date key in "YYYY-MM-DD" format for the given (or current) date.
 * Example: "2026-03-14"
 */
export function getUtcDayKey(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Returns UTC month key in "YYYY-MM" format for the given (or current) date.
 * Example: "2026-03"
 */
export function getUtcMonthKey(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
