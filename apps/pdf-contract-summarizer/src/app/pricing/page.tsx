import Link from "next/link";

export const metadata = {
  title: "Pricing — PDF & Contract Summarizer",
  description:
    "Simple, transparent pricing. Start free, upgrade to Pro for $19/month.",
};

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/ month",
    description: "Perfect for trying out the service.",
    features: [
      "3 PDF summaries / month",
      "Up to 10 MB per file",
      "Standard response time",
    ],
    cta: "Get started free",
    ctaHref: "/api/auth/signin",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/ month",
    description:
      "For professionals who summarize frequently. Includes 200 summaries per month.",
    features: [
      "200 PDF & contract summaries / month",
      "Up to 50 MB per file",
      "Priority response time",
      "Overage: $0.05 per extra summary beyond 200",
    ],
    cta: "Upgrade to Pro",
    ctaHref: "/api/stripe/checkout",
    highlighted: true,
  },
];

export default function PricingPage() {
  return (
    <main className="pricing-page">
      <section className="pricing-hero">
        <h1>Simple, transparent pricing</h1>
        <p>
          Start for free. Upgrade when you need more. No hidden fees —
          overage is billed at&nbsp;
          <strong>$0.05 per summary</strong> only after you exceed 200&nbsp;/ month.
        </p>
      </section>

      <section className="pricing-cards">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`pricing-card${plan.highlighted ? " pricing-card--highlighted" : ""}`}
          >
            <div className="pricing-card__header">
              <h2>{plan.name}</h2>
              <div className="pricing-card__price">
                <span className="pricing-card__amount">{plan.price}</span>
                <span className="pricing-card__period">{plan.period}</span>
              </div>
              <p className="pricing-card__description">{plan.description}</p>
            </div>

            <ul className="pricing-card__features">
              {plan.features.map((f) => (
                <li key={f}>
                  <span aria-hidden="true">✓</span> {f}
                </li>
              ))}
            </ul>

            <div className="pricing-card__footer">
              {plan.highlighted ? (
                <form action="/api/stripe/checkout" method="POST">
                  <button type="submit" className="btn btn--primary">
                    {plan.cta}
                  </button>
                </form>
              ) : (
                <Link href={plan.ctaHref} className="btn btn--secondary">
                  {plan.cta}
                </Link>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className="pricing-faq">
        <h2>Frequently asked questions</h2>

        <details>
          <summary>What counts as a summary request?</summary>
          <p>
            Each time you upload a PDF or contract and receive a summary, one
            request is counted. Retries or re-summaries of the same file each
            count as a new request.
          </p>
        </details>

        <details>
          <summary>How does overage billing work?</summary>
          <p>
            The Pro plan includes <strong>200 summaries per calendar month</strong>.
            Summary #201 and beyond are billed at{" "}
            <strong>$0.05 per summary</strong> (metered billing via Stripe).
            Stripe automatically totals all overage usage at the end of your
            billing period and adds it to your invoice.
          </p>
        </details>

        <details>
          <summary>Can I cancel at any time?</summary>
          <p>
            Yes. Cancel from your dashboard at any time. Your Pro access
            remains active until the end of the current billing period.
          </p>
        </details>

        <details>
          <summary>What payment methods are accepted?</summary>
          <p>
            All major credit and debit cards are accepted via Stripe's secure
            checkout. No card details are stored on our servers.
          </p>
        </details>
      </section>
    </main>
  );
}
