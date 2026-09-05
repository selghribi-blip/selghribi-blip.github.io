/**
 * app/pricing/page.tsx – Pricing page
 */
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const features = {
  free: [
    "3 summaries / day",
    "PDF uploads up to 5 MB",
    "General summary mode",
    "No credit card required",
  ],
  pro: [
    "200 included summaries / month",
    "Overage billing after 200 (pay-as-you-go)",
    "PDF uploads up to 35 MB",
    "General + Contract summary mode",
    "Priority AI processing",
  ],
};

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const isSignedIn = !!session?.user;
  const isPro = (session?.user as { plan?: string })?.plan === "PRO";

  async function handleUpgrade() {
    if (!isSignedIn) {
      router.push("/auth/sign-in?callbackUrl=/pricing");
      return;
    }
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-sm text-brand-600 hover:underline mb-8 inline-block">
          ← Back to home
        </Link>
        <h1 className="text-4xl font-extrabold text-center text-slate-900 mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-center text-slate-500 mb-12">
          Start free, upgrade when you need more.
        </p>

        <div className="grid sm:grid-cols-2 gap-8">
          {/* Free */}
          <div className="bg-white rounded-2xl border p-8 shadow-sm">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Free
            </p>
            <p className="text-4xl font-bold text-slate-900 mb-1">$0</p>
            <p className="text-slate-400 text-sm mb-6">Forever free</p>
            <ul className="space-y-2 mb-8">
              {features.free.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-green-500 mt-0.5">✓</span> {f}
                </li>
              ))}
            </ul>
            {isSignedIn && !isPro ? (
              <div className="w-full text-center py-2.5 rounded-lg bg-slate-100 text-slate-500 text-sm font-medium">
                Current plan
              </div>
            ) : (
              <Link
                href={isSignedIn ? "/dashboard" : "/auth/sign-in"}
                className="block w-full text-center py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:border-brand-500 transition"
              >
                Get started
              </Link>
            )}
          </div>

          {/* Pro */}
          <div className="bg-brand-600 text-white rounded-2xl p-8 shadow-lg relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-white text-brand-600 text-xs font-bold px-2 py-0.5 rounded-full">
              Most popular
            </div>
            <p className="text-sm font-semibold uppercase tracking-wide mb-2 text-brand-100">
              Pro
            </p>
            <p className="text-4xl font-bold mb-1">$19</p>
            <p className="text-brand-200 text-sm mb-6">per month + overage</p>
            <ul className="space-y-2 mb-8">
              {features.pro.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="text-white mt-0.5">✓</span> {f}
                </li>
              ))}
            </ul>
            {isPro ? (
              <div className="w-full text-center py-2.5 rounded-lg bg-brand-700 text-white text-sm font-medium">
                Current plan
              </div>
            ) : (
              <button
                onClick={handleUpgrade}
                className="w-full text-center py-2.5 rounded-lg bg-white text-brand-700 text-sm font-semibold hover:bg-brand-50 transition"
              >
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
          Overage on Pro: each summary beyond the included 200/month is billed at a
          metered rate. You only pay for what you use.
        </p>
      </div>
    </div>
  );
}
