export const PLAN_LIMITS = {
  free: {
    dailySummaries: 3,
    maxPdfBytes: 5 * 1024 * 1024,
    contractMode: false,
  },
  pro: {
    dailySummaries: Infinity,
    maxPdfBytes: 20 * 1024 * 1024,
    contractMode: true,
  },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

export function getLimits(plan: string) {
  return PLAN_LIMITS[plan as Plan] ?? PLAN_LIMITS.free;
}
