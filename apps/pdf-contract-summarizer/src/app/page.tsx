import Link from "next/link";
import { auth } from "@/lib/auth";
import { FREE_DAILY_LIMIT, PRO_MONTHLY_LIMIT } from "@/lib/quota";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-col items-center gap-12 py-12 text-center">
      {/* Hero */}
      <div className="flex flex-col items-center gap-4 max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Summarize PDFs & Contracts{" "}
          <span className="text-indigo-600">with AI</span>
        </h1>
        <p className="text-lg text-gray-600">
          Upload any PDF — research papers, reports, legal contracts — and get a
          clear, structured summary in seconds.
        </p>

        <div className="flex gap-3 mt-2">
          {session ? (
            <Link
              href="/summarize"
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 transition"
            >
              Go to Summarize
            </Link>
          ) : (
            <Link
              href="/auth/sign-in"
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 transition"
            >
              Get Started Free
            </Link>
          )}
          <Link
            href="/pricing"
            className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-100 transition"
          >
            View Pricing
          </Link>
        </div>
      </div>

      {/* Plans at a glance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl text-left">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-2">Free Plan</h2>
          <ul className="text-sm text-gray-600 flex flex-col gap-1">
            <li>✓ {FREE_DAILY_LIMIT} summaries / day</li>
            <li>✓ General PDF summary</li>
            <li>✓ Up to 5 MB PDFs</li>
          </ul>
        </div>
        <div className="rounded-2xl border-2 border-indigo-500 bg-white p-6 shadow-sm ring-2 ring-indigo-300">
          <h2 className="text-lg font-bold mb-2 text-indigo-700">
            Pro Plan <span className="text-sm font-semibold">($9/mo)</span>
          </h2>
          <ul className="text-sm text-gray-600 flex flex-col gap-1">
            <li>✓ {PRO_MONTHLY_LIMIT} summaries / month</li>
            <li>✓ Contract Summary mode ✨</li>
            <li>✓ Up to 25 MB PDFs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
