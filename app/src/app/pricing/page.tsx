import Link from 'next/link';

export const metadata = {
  title: 'Pricing — PDF & Contract Summarizer',
};

export default function PricingPage() {
  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h1>
        <p className="text-gray-600">Start free. Upgrade when you need contract analysis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {/* Free Plan */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Free</h2>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold text-gray-900">$0</span>
              <span className="text-gray-500 mb-1">/month</span>
            </div>
            <p className="text-gray-500 text-sm mt-2">Perfect for occasional PDF summaries.</p>
          </div>

          <ul className="space-y-3 mb-8 text-sm">
            <li className="flex items-center gap-2 text-gray-700">
              <span className="text-green-500">✓</span>
              <strong>5 PDF summaries per day</strong>
            </li>
            <li className="flex items-center gap-2 text-gray-700">
              <span className="text-green-500">✓</span>
              Standard document summary
            </li>
            <li className="flex items-center gap-2 text-gray-700">
              <span className="text-green-500">✓</span>
              Up to 10 MB per PDF
            </li>
            <li className="flex items-center gap-2 text-gray-700">
              <span className="text-green-500">✓</span>
              OAuth sign-in (GitHub / Google)
            </li>
            <li className="flex items-center gap-2 text-gray-400">
              <span>✗</span>
              Contract Mode
            </li>
          </ul>

          <Link
            href="/dashboard"
            className="w-full block text-center border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:border-gray-400 transition-colors"
          >
            Get started free
          </Link>
        </div>

        {/* Pro Plan */}
        <div className="bg-primary-500 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-white text-primary-500 text-xs font-bold px-2 py-1 rounded-full">
            POPULAR
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold mb-1">Pro</h2>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold">$9</span>
              <span className="text-orange-100 mb-1">/month</span>
            </div>
            <p className="text-orange-100 text-sm mt-2">
              For legal, business, and power users.
            </p>
          </div>

          <ul className="space-y-3 mb-8 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-orange-200">✓</span>
              <strong>Unlimited PDF summaries</strong>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-orange-200">✓</span>
              Standard document summary
            </li>
            <li className="flex items-center gap-2">
              <span className="text-orange-200">✓</span>
              Up to 10 MB per PDF
            </li>
            <li className="flex items-center gap-2">
              <span className="text-orange-200">✓</span>
              OAuth sign-in (GitHub / Google)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-orange-200">✓</span>
              <strong>Contract Mode</strong> — parties, obligations, risk clauses
            </li>
          </ul>

          <form action="/api/billing" method="POST">
            <button
              type="submit"
              className="w-full bg-white text-primary-500 px-6 py-3 rounded-lg font-bold hover:bg-orange-50 transition-colors"
            >
              Upgrade to Pro
            </button>
          </form>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500 mt-8">
        Billed monthly. Cancel anytime. Secure payments by{' '}
        <a
          href="https://stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Stripe
        </a>
        .
      </p>
    </div>
  );
}
