import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home-page">
      <section className="hero">
        <h1>Summarize PDFs &amp; Contracts in Seconds</h1>
        <p>
          Upload any PDF or legal contract and get an AI-powered summary
          highlighting key parties, obligations, dates, and risks.
        </p>
        <div className="hero__cta">
          <Link href="/dashboard" className="btn btn--primary">
            Start summarizing
          </Link>
          <Link href="/pricing" className="btn btn--secondary">
            View pricing
          </Link>
        </div>
      </section>

      <section className="home-pricing-snapshot">
        <h2>Simple pricing</h2>
        <p>
          <strong>Free:</strong> 3 summaries / month &mdash; no card required.
          <br />
          <strong>Pro:</strong> $19 / month · 200 summaries included ·
          $0.05 per extra summary beyond 200.
        </p>
        <Link href="/pricing">See full pricing &rarr;</Link>
      </section>
    </main>
  );
}
