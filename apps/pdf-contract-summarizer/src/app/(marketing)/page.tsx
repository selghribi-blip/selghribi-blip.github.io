import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 text-center">
      <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-gray-900">
        PDF & Contract{" "}
        <span className="text-brand-600">Summarizer</span>
      </h1>
      <p className="mb-8 text-xl text-gray-600">
        Upload any PDF — research papers, contracts, reports — and get a clear AI-powered summary in seconds.
        <br />
        <span className="font-medium text-gray-800">Supports English & Arabic.</span>
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/auth/sign-in"
          className="rounded-xl bg-brand-600 px-8 py-3 text-base font-semibold text-white hover:bg-brand-700"
        >
          Get started free →
        </Link>
        <Link href="/pricing" className="text-base font-medium text-gray-700 hover:text-brand-600">
          See pricing
        </Link>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-6 text-left md:grid-cols-3">
        {[
          { icon: "📄", title: "Any PDF", desc: "Research papers, invoices, reports — we handle them all." },
          { icon: "⚖️", title: "Contract Mode", desc: "Extracts clauses, parties, obligations, and risk points. Pro only." },
          { icon: "🌍", title: "Arabic & English", desc: "Auto-detects language and summarizes in the same language." },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-2 text-3xl">{f.icon}</div>
            <h3 className="mb-1 text-base font-semibold text-gray-900">{f.title}</h3>
            <p className="text-sm text-gray-600">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
