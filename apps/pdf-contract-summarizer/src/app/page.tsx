/**
 * app/page.tsx – Marketing landing page
 */
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <span className="font-bold text-xl text-brand-700">📄 PDF & Contract Summarizer</span>
        <div className="flex gap-4">
          <Link href="/pricing" className="text-sm text-slate-600 hover:text-brand-600">
            Pricing
          </Link>
          <Link
            href="/auth/sign-in"
            className="text-sm bg-brand-600 text-white px-4 py-1.5 rounded-lg hover:bg-brand-700"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <h1 className="text-5xl font-extrabold text-slate-900 mb-4 max-w-3xl">
          Summarise any PDF in&nbsp;seconds
        </h1>
        <p className="text-lg text-slate-600 mb-8 max-w-xl">
          Upload a PDF — research papers, legal contracts, reports — and get a
          clear, concise AI summary. Contract mode gives you party obligations,
          risk flags, and payment terms at a glance.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/auth/sign-in"
            className="bg-brand-600 text-white px-6 py-3 rounded-xl text-base font-semibold hover:bg-brand-700 transition"
          >
            Get started — it&apos;s free
          </Link>
          <Link
            href="/pricing"
            className="border border-slate-300 text-slate-700 px-6 py-3 rounded-xl text-base font-semibold hover:border-brand-500 transition"
          >
            View pricing
          </Link>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl w-full">
          {[
            {
              icon: "⚡",
              title: "Fast & accurate",
              desc: "Powered by GPT-4o-mini for reliable summaries.",
            },
            {
              icon: "⚖️",
              title: "Contract mode (Pro)",
              desc: "Parties, obligations, risk flags — all extracted automatically.",
            },
            {
              icon: "🔒",
              title: "Secure by design",
              desc: "Your PDFs are processed in-memory and never stored.",
            },
          ].map((f) => (
            <div key={f.title} className="bg-white border rounded-xl p-6 text-left shadow-sm">
              <div className="text-3xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-slate-800 mb-1">{f.title}</h3>
              <p className="text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-slate-400 border-t">
        © {new Date().getFullYear()} PDF & Contract Summarizer · Built with Next.js & Stripe
      </footer>
    </div>
  );
}
