import React from "react";

interface QuotaDisplayProps {
  plan: "FREE" | "PRO";
  used: number;
  included: number;
  remaining: number;
  isOverage: boolean;
}

/**
 * Displays the user's current usage quota with a progress bar.
 * Shows an overage warning when the Pro user has exceeded included summaries.
 */
export function QuotaDisplay({ plan, used, included, remaining, isOverage }: QuotaDisplayProps) {
  const periodLabel = plan === "FREE" ? "today" : "this month";
  const pct = Math.min(100, Math.round((used / included) * 100));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {plan === "FREE" ? "Daily quota" : "Monthly quota"}
        </span>
        <span className="text-xs text-gray-500">
          {used}/{included} {periodLabel}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full transition-all ${
            isOverage ? "bg-orange-500" : pct >= 80 ? "bg-yellow-400" : "bg-brand-500"
          }`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>

      {isOverage ? (
        <p className="mt-2 text-xs font-medium text-orange-600">
          ⚡ Overage billing active — each extra summary costs $0.05
        </p>
      ) : remaining === 0 ? (
        <p className="mt-2 text-xs text-red-600">
          You&apos;ve used all {included} included summaries {periodLabel}.
          {plan === "FREE" && " Upgrade to Pro for more."}
        </p>
      ) : (
        <p className="mt-2 text-xs text-gray-500">
          {remaining} remaining {periodLabel}
          {plan === "PRO" && remaining <= 20 && (
            <span className="ml-1 text-yellow-600">(running low — next summaries will be billed at $0.05 each)</span>
          )}
        </p>
      )}
    </div>
  );
}
