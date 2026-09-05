"use client";

import { PLANS } from "@/lib/stripe/plans";

export default function PricingCards() {
  async function handleUpgrade() {
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = (await res.json()) as { url?: string; error?: string };
    if (data.url) window.location.href = data.url;
    else alert(data.error ?? "Something went wrong.");
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:justify-center">
      {PLANS.map((plan) => (
        <div
          key={plan.id}
          className={`rounded-2xl border p-6 shadow-sm w-full max-w-xs flex flex-col gap-4 ${
            plan.id === "pro" ? "border-indigo-500 ring-2 ring-indigo-400" : "border-gray-200"
          }`}
        >
          <div>
            <h2 className="text-xl font-bold">{plan.name}</h2>
            <p className="text-3xl font-extrabold mt-1">{plan.price}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {plan.limit} summaries {plan.periodLabel}
            </p>
          </div>

          <ul className="flex flex-col gap-1.5 text-sm text-gray-700">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-1.5">
                <span className="text-green-500">✓</span> {f}
              </li>
            ))}
          </ul>

          {plan.id === "pro" ? (
            <button
              onClick={handleUpgrade}
              className="mt-auto w-full rounded-xl bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
            >
              Upgrade to Pro
            </button>
          ) : (
            <a
              href="/summarize"
              className="mt-auto block w-full rounded-xl border border-gray-300 py-2 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Get Started Free
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
