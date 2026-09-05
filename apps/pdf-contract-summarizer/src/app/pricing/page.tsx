import { PricingCards } from "@/components/PricingCards";

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900">Simple, transparent pricing</h1>
        <p className="mt-3 text-lg text-gray-600">
          Start free. Upgrade when you need more.
        </p>
      </div>
      <PricingCards />

      <div className="mt-12 rounded-xl bg-gray-50 p-6 text-sm text-gray-600">
        <h3 className="mb-2 font-semibold text-gray-800">How overage billing works</h3>
        <p>
          Pro plan includes <strong>200 summaries per month</strong>. After that, you&apos;re charged{" "}
          <strong>$0.05 per additional summary</strong> via Stripe metered billing. Overage usage
          is reported to Stripe in real-time and appears on your next monthly invoice. No surprise
          bills — you can monitor usage in your Stripe billing portal.
        </p>
      </div>
    </div>
  );
}
