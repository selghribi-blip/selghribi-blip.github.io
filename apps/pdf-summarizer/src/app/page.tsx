import Link from 'next/link';

/**
 * Landing page — hero section, feature cards, and a pricing CTA.
 * Server component (no client-side interactivity needed here).
 */
export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center px-6 py-28 text-center">
        <span className="mb-4 inline-block rounded-full bg-indigo-900/50 px-4 py-1 text-sm font-medium text-indigo-300 ring-1 ring-indigo-500/30">
          Powered by AI
        </span>
        <h1 className="mb-6 max-w-3xl text-5xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
          Turn any PDF into a clear summary{' '}
          <span className="text-indigo-400">in seconds</span>
        </h1>
        <p className="mb-10 max-w-xl text-lg text-gray-400">
          Upload your PDF, let our AI extract and distill the key insights — no
          copy-paste, no reading walls of text.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/upload"
            className="rounded-lg bg-indigo-600 px-7 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            Try it free →
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-gray-700 px-7 py-3 text-base font-semibold text-gray-300 transition hover:border-gray-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            See pricing
          </Link>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="bg-gray-900/50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-white">
            Everything you need
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon="📄"
              title="PDF Upload"
              description="Drag and drop any PDF up to 10 MB. We extract the raw text instantly — no server-side storage of your document."
            />
            <FeatureCard
              icon="🤖"
              title="AI Summary"
              description="Powered by GPT-4o-mini or Claude Haiku, your document is distilled into a concise, readable summary."
            />
            <FeatureCard
              icon="🔒"
              title="Secure & Private"
              description="Only the extracted text is processed. Summaries are stored under your account and visible only to you."
            />
          </div>
        </div>
      </section>

      {/* ── Pricing CTA ──────────────────────────────────────────── */}
      <section className="px-6 py-20 text-center">
        <h2 className="mb-4 text-3xl font-bold text-white">
          One plan. Unlimited summaries.
        </h2>
        <p className="mb-8 text-gray-400">
          Get started for just $9.99 / month.
        </p>
        <Link
          href="/pricing"
          className="inline-block rounded-lg bg-indigo-600 px-8 py-3 text-base font-semibold text-white transition hover:bg-indigo-500"
        >
          View pricing
        </Link>
      </section>
    </div>
  );
}

/** Small reusable feature card */
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 transition hover:border-gray-700">
      <div className="mb-3 text-4xl">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}
