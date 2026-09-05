import React from "react";

interface PlanBadgeProps {
  plan: "FREE" | "PRO";
  isOverage?: boolean;
}

/**
 * Compact badge showing the user's current plan and overage status.
 */
export function PlanBadge({ plan, isOverage }: PlanBadgeProps) {
  if (plan === "PRO" && isOverage) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
        ⚡ Pro — Overage
      </span>
    );
  }
  if (plan === "PRO") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
        ✦ Pro
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
      Free
    </span>
  );
}
