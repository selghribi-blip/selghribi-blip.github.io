"use client";

/**
 * QuotaBadge — shows remaining summaries for the current user.
 *
 * Free plan  → "X / 3 remaining today"
 * Pro  plan  → "X / 200 remaining this month"
 */

import { useEffect, useState } from "react";

interface QuotaData {
  plan: "free" | "pro";
  used: number;
  limit: number;
  remaining: number;
  period: string;
}

export default function QuotaBadge() {
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/quota")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.quota) setQuota(data.quota as QuotaData);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500 animate-pulse">
        Loading quota…
      </div>
    );
  }

  if (!quota) return null;

  const isPro = quota.plan === "pro";
  const periodLabel = isPro ? "this month" : "today";
  const isEmpty = quota.remaining === 0;

  // Color: red when empty, amber when low (≤1), green otherwise.
  const colorClass = isEmpty
    ? "bg-red-100 text-red-700 border-red-200"
    : quota.remaining <= 1
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-green-100 text-green-700 border-green-200";

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${colorClass}`}
      title={`Period: ${quota.period} | Used: ${quota.used} / ${quota.limit}`}
    >
      <span>
        {isPro ? "Pro" : "Free"} ·{" "}
        <strong>
          {quota.remaining} / {quota.limit}
        </strong>{" "}
        remaining {periodLabel}
      </span>
      {isEmpty && (
        <a href="/pricing" className="underline ml-1 font-semibold">
          {isPro ? "Limit reached" : "Upgrade →"}
        </a>
      )}
    </div>
  );
}
