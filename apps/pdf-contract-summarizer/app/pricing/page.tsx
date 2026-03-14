import Link from "next/link";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";

export default async function PricingPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userImage={user?.image} userName={user?.name} />

      <main className="flex-1 flex flex-col items-center px-4 py-20">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 text-center">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-gray-600 mb-16 text-center">
          Start free. Upgrade when you need more.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl w-full">
          {/* Free plan */}
          <div className="rounded-2xl bg-white border border-gray-200 p-8 shadow-sm flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Free</h2>
            <div className="text-4xl font-extrabold text-gray-900 mb-6">
              $0
              <span className="text-lg font-normal text-gray-500">/mo</span>
            </div>
            <ul className="space-y-3 text-sm text-gray-700 mb-8 flex-1">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                3 summaries per day
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                Up to 5MB PDF
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                General summary mode
              </li>
              <li className="flex items-start gap-2 text-gray-400">
                <span>✗</span>
                Contract analysis
              </li>
            </ul>
            <Link
              href={user ? "/dashboard" : "/auth/sign-in"}
              className="rounded-xl border border-gray-300 bg-white py-3 text-center text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              {user ? "Go to Dashboard" : "Get started free"}
            </Link>
          </div>

          {/* Pro plan */}
          <div className="rounded-2xl bg-indigo-600 border border-indigo-600 p-8 shadow-sm flex flex-col text-white">
            <h2 className="text-xl font-bold mb-2">Pro</h2>
            <div className="text-4xl font-extrabold mb-6">
              $19
              <span className="text-lg font-normal text-indigo-200">/mo</span>
            </div>
            <ul className="space-y-3 text-sm text-indigo-100 mb-8 flex-1">
              <li className="flex items-start gap-2">
                <span className="text-indigo-200">✓</span>
                200 summaries included/month
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-200">✓</span>
                Up to 35MB PDF
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-200">✓</span>
                General + Contract analysis modes
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-200">✓</span>
                <span>
                  <strong>$0.05 per extra summary</strong> after 200/month
                  (metered billing)
                </span>
              </li>
            </ul>
            <form action="/api/stripe/checkout" method="POST">
              <button
                type="submit"
                className="w-full rounded-xl bg-white py-3 text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors"
              >
                Upgrade to Pro
              </button>
            </form>
          </div>
        </div>

        <p className="mt-12 text-sm text-gray-500 text-center">
          Overage billing is metered via Stripe. You only pay for what you use
          beyond your included quota.
        </p>
      </main>
    </div>
  );
}
