"use client";

import React from "react";
import { PLANS } from "@/lib/stripe/plans";

/**
 * Pricing cards component.
 * Shows Free and Pro tiers with overage billing details.
 */
export function PricingCards() {
  const handleUpgrade = async () => {
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      {/* Free */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-4">
          <span className="text-sm font-medium text-gray-500">Free</span>
          <p className="mt-1 text-3xl font-bold text-gray-900">$0</p>
          <p className="text-sm text-gray-500">/ month</p>
        </div>
        <ul className="mb-8 space-y-3 text-sm text-gray-700">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            {PLANS.free.summariesPerDay} summaries per day
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Up to {PLANS.free.maxFileSizeBytes / (1024 * 1024)}MB PDF
          </li>
          <li className="flex items-center gap-2">
            <span className="text-red-400">✕</span>
            Contract mode (Pro only)
          </li>
        </ul>
        <p className="rounded-lg bg-gray-50 px-4 py-2 text-center text-sm text-gray-500">
          Current plan
        </p>
      </div>

      {/* Pro */}
      <div className="relative rounded-2xl border-2 border-brand-500 bg-white p-8 shadow-md">
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-0.5 text-xs font-bold text-white">
          RECOMMENDED
        </span>
        <div className="mb-4">
          <span className="text-sm font-medium text-brand-600">Pro</span>
          <p className="mt-1 text-3xl font-bold text-gray-900">$9</p>
          <p className="text-sm text-gray-500">/ month</p>
        </div>
        <ul className="mb-8 space-y-3 text-sm text-gray-700">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            {PLANS.pro.summariesPerMonth} summaries included / month
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Up to {PLANS.pro.maxFileSizeBytes / (1024 * 1024)}MB PDF
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Contract mode (legal clause extraction)
          </li>
          <li className="flex items-center gap-2">
            <span className="text-orange-500">⚡</span>
            <span>
              Overage: <strong>$0.05 per extra summary</strong> beyond 200/month
            </span>
          </li>
        </ul>
        <button
          onClick={handleUpgrade}
          className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 active:scale-95 transition"
        >
          Upgrade to Pro
        </button>
      </div>
    </div>
  );
}
