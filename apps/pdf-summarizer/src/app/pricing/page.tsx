'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { CheckoutResponse } from '@/types';

/**
 * Pricing page — displays the single Pro plan and triggers Stripe Checkout on subscribe.
 */
export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /** Calls /api/stripe/checkout and redirects the user to the Stripe-hosted page */
  async function handleSubscribe() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? 'Something went wrong');
        return;
      }
      const { url } = (await res.json()) as CheckoutResponse;
      router.push(url);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="mb-4 text-4xl font-extrabold text-white">Simple pricing</h1>
      <p className="mb-12 text-gray-400">
        One plan. Unlimited PDF summaries. Cancel anytime.
      </p>

      <div className="rounded-2xl border border-indigo-700/50 bg-gray-900 p-8 shadow-xl ring-1 ring-indigo-500/20">
        <div className="mb-2 text-sm font-semibold uppercase tracking-widest text-indigo-400">
          Pro
        </div>
        <div className="mb-6 flex items-end justify-center gap-1">
          <span className="text-6xl font-extrabold text-white">$9.99</span>
          <span className="mb-2 text-gray-400">/ month</span>
        </div>

        <ul className="mb-8 space-y-3 text-left text-sm text-gray-300">
          {[
            'Unlimited PDF uploads',
            'Unlimited AI summaries',
            'Full summary history',
            'Copy summaries to clipboard',
            'Cancel anytime',
          ].map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <span className="text-indigo-400">✓</span>
              {feature}
            </li>
          ))}
        </ul>

        {error && (
          <p className="mb-4 text-sm text-red-400">{error}</p>
        )}

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Redirecting to Stripe…' : 'Subscribe now'}
        </button>

        <p className="mt-4 text-xs text-gray-500">
          Secured by Stripe. You will be redirected to complete payment.
        </p>
      </div>
    </div>
  );
}
