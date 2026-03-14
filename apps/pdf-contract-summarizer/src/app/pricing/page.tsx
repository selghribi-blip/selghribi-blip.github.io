import Link from "next/link";

const FREE_FEATURES = [
  "5 summaries per month",
  "PDF & contract upload",
  "AI-powered summaries",
  "Email support",
];

const PRO_FEATURES = [
  "200 summaries per month included",
  "$0.05 per extra summary (overage)",
  "PDF & contract upload",
  "AI-powered summaries",
  "Priority email support",
  "API access",
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-600">
            Start free. Upgrade when you need more.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Free
              </h2>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-500">/ month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-gray-700">
                  <span className="mt-0.5 text-green-500">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href="/dashboard"
              className="block text-center py-3 px-6 rounded-lg border-2 border-gray-900 text-gray-900 font-semibold hover:bg-gray-900 hover:text-white transition-colors"
            >
              Get started free
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-gray-900 rounded-2xl shadow-lg p-8 flex flex-col relative overflow-hidden">
            {/* Badge */}
            <div className="absolute top-4 right-4 bg-amber-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
              POPULAR
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-1">Pro</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">$19</span>
                <span className="text-gray-400">/ month</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Includes 200 summaries/month.{" "}
                <strong className="text-gray-300">
                  $0.05 per extra summary
                </strong>{" "}
                after that.
              </p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-gray-300">
                  <span className="mt-0.5 text-amber-400">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            {/* Overage note */}
            <div className="bg-gray-800 rounded-lg p-3 mb-6 text-sm text-gray-400">
              <strong className="text-gray-200">Overage billing:</strong> After
              your 200 included summaries, each additional summary is billed at
              $0.05 via Stripe metered usage. You&apos;ll see the overage charge on
              your monthly invoice.
            </div>

            <UpgradeButton />
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently asked questions
          </h2>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              How does overage billing work?
            </h3>
            <p className="text-gray-600">
              The Pro plan includes 200 summaries per month. Starting from
              summary #201, each additional summary records one usage unit in
              Stripe. At the end of your billing period, Stripe charges{" "}
              <strong>$0.05 × (extra summaries)</strong> automatically on your
              invoice.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              When is overage charged?
            </h3>
            <p className="text-gray-600">
              Overage is billed in arrears — at the end of each monthly billing
              cycle, not in real time. Your summaries are never blocked; you can
              always summarize documents and the cost is settled on your next
              invoice.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              Can I cancel anytime?
            </h3>
            <p className="text-gray-600">
              Yes. You can cancel your Pro subscription at any time. You&apos;ll
              retain Pro access until the end of the current billing period.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * Client component for the upgrade button.
 * Calls POST /api/stripe/checkout and redirects to Stripe Checkout.
 */
function UpgradeButton() {
  return (
    <form action="/api/stripe/checkout" method="POST">
      <button
        type="submit"
        className="w-full py-3 px-6 rounded-lg bg-amber-400 text-gray-900 font-semibold hover:bg-amber-300 transition-colors"
      >
        Upgrade to Pro — $19/mo
      </button>
    </form>
  );
}
