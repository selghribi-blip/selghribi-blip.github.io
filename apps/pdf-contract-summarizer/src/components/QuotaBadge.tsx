/**
 * components/QuotaBadge.tsx
 * Displays remaining quota or overage status.
 */
"use client";

interface QuotaBadgeProps {
  plan: "FREE" | "PRO";
  remainingToday?: number;
  remainingMonthIncluded?: number;
  overageCountThisMonth?: number;
}

export function QuotaBadge({
  plan,
  remainingToday,
  remainingMonthIncluded,
  overageCountThisMonth,
}: QuotaBadgeProps) {
  if (plan === "FREE") {
    const left = remainingToday ?? 0;
    const color = left === 0 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600";
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${color}`}>
        {left === 0 ? "⛔" : "📊"} {left} / 3 summaries today (Free)
      </span>
    );
  }

  // PRO
  const includedLeft = remainingMonthIncluded ?? 0;
  const overage = overageCountThisMonth ?? 0;

  if (overage > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
        ⚡ Overage billing active — {overage} extra summary{overage !== 1 ? "ies" : ""} this month
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
      📊 {includedLeft} included summaries left this month (Pro)
    </span>
  );
}
