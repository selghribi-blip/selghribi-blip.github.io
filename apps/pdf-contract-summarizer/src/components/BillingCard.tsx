"use client";

import { useState } from "react";

interface BillingCardProps {
  plan: string;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  hasCustomerId: boolean;
}

export default function BillingCard({
  plan,
  subscriptionStatus,
  currentPeriodEnd,
  hasCustomerId,
}: BillingCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Failed to create checkout session.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleManage() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Failed to open billing portal.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isPro = plan === "pro";

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{isPro ? "⭐" : "🆓"}</span>
        <div>
          <h2 className="font-bold text-xl text-white capitalize">{plan} Plan</h2>
          {subscriptionStatus && (
            <p className="text-sm text-slate-400 capitalize">{subscriptionStatus}</p>
          )}
        </div>
      </div>

      <ul className="space-y-2 text-sm">
        {isPro ? (
          <>
            <li className="text-teal-400">✅ Unlimited summaries per day</li>
            <li className="text-teal-400">✅ Up to 20 MB PDFs</li>
            <li className="text-teal-400">✅ Contract mode (clauses, dates, risks)</li>
            {currentPeriodEnd && (
              <li className="text-slate-400">
                📅 Current period ends:{" "}
                {new Date(currentPeriodEnd).toLocaleDateString()}
              </li>
            )}
          </>
        ) : (
          <>
            <li className="text-slate-400">✅ 3 summaries per day</li>
            <li className="text-slate-400">✅ Up to 5 MB PDFs</li>
            <li className="text-slate-500">🔒 Contract mode (Pro only)</li>
          </>
        )}
      </ul>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          {error}
        </p>
      )}

      {isPro ? (
        hasCustomerId && (
          <button
            onClick={handleManage}
            disabled={loading}
            className="w-full py-3 rounded-xl border border-white/10 text-slate-300 hover:border-white/30 hover:text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : "Manage Billing"}
          </button>
        )
      ) : (
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-blue-500 text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Loading..." : "Upgrade to Pro"}
        </button>
      )}
    </div>
  );
}
