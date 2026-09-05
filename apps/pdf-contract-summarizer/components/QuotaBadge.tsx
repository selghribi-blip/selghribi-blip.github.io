"use client";

type QuotaInfo = {
  plan: "free" | "pro";
  remaining: number | null;
  limit: number;
  period: "day" | "month";
  isOverage: boolean;
};

export function QuotaBadge({ quota }: { quota: QuotaInfo }) {
  if (quota.plan === "free") {
    return (
      <div className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-1.5 text-sm text-gray-700">
        <span className="font-medium">Free</span>
        <span className="text-gray-400">·</span>
        <span>
          {quota.remaining}/{quota.limit} remaining today
        </span>
      </div>
    );
  }

  if (quota.isOverage) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm text-amber-800">
        <span className="font-medium">Pro</span>
        <span className="text-amber-400">·</span>
        <span>
          Overage billing active — <strong>$0.05</strong> per additional summary
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-sm text-indigo-800">
      <span className="font-medium">Pro</span>
      <span className="text-indigo-400">·</span>
      <span>
        {quota.remaining}/{quota.limit} included summaries remaining this month
      </span>
    </div>
  );
}
