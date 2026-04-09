import type { Metadata } from "next";
import PricingCards from "@/components/PricingCards";
import { FREE_DAILY_LIMIT, PRO_MONTHLY_LIMIT } from "@/lib/quota";

export const metadata: Metadata = { title: "Pricing · PDF & Contract Summarizer" };

export default function PricingPage() {
  return (
    <div className="flex flex-col items-center gap-10 py-8">
      <div className="text-center max-w-xl">
        <h1 className="text-3xl font-extrabold">Simple, Transparent Pricing</h1>
        <p className="mt-3 text-gray-600">
          Start for free. Upgrade to Pro for more summaries and Contract mode.
        </p>
      </div>

      <PricingCards />

      {/* Comparison table */}
      <div className="w-full max-w-2xl overflow-x-auto mt-4">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 pr-4 font-semibold text-gray-700">Feature</th>
              <th className="py-2 px-4 text-center font-semibold text-gray-700">Free</th>
              <th className="py-2 px-4 text-center font-semibold text-indigo-700">Pro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[
              ["Summaries", `${FREE_DAILY_LIMIT} / day`, `${PRO_MONTHLY_LIMIT} / month`],
              ["General PDF Summary", "✓", "✓"],
              ["Contract Summary mode", "✗", "✓"],
              ["Max PDF size", "5 MB", "25 MB"],
              ["English & Arabic output", "✓", "✓"],
              ["Priority support", "✗", "✓"],
            ].map(([feature, free, pro]) => (
              <tr key={feature}>
                <td className="py-2.5 pr-4 text-gray-700">{feature}</td>
                <td className="py-2.5 px-4 text-center text-gray-500">{free}</td>
                <td className="py-2.5 px-4 text-center text-indigo-700 font-medium">{pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
