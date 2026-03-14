import Link from "next/link";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";

export default async function HomePage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userImage={user?.image} userName={user?.name} />

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
        <span className="inline-block rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium px-4 py-1 mb-6">
          AI-powered document summarization
        </span>
        <h1 className="text-5xl font-extrabold text-gray-900 max-w-3xl leading-tight mb-6">
          Summarize PDFs &amp; Analyze Contracts in Seconds
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mb-10">
          Upload any PDF — research papers, legal contracts, reports — and get
          clear, structured summaries instantly. Supports Arabic &amp; English.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-xl bg-indigo-600 px-8 py-3.5 text-white font-semibold text-lg hover:bg-indigo-700 transition-colors"
            >
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link
                href="/auth/sign-in"
                className="rounded-xl bg-indigo-600 px-8 py-3.5 text-white font-semibold text-lg hover:bg-indigo-700 transition-colors"
              >
                Get started free
              </Link>
              <Link
                href="/pricing"
                className="rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-gray-700 font-semibold text-lg hover:bg-gray-50 transition-colors"
              >
                See pricing
              </Link>
            </>
          )}
        </div>

        {/* Feature grid */}
        <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl text-left">
          {[
            {
              emoji: "📄",
              title: "General PDF Summary",
              description:
                "Upload any PDF and get bullet-point summaries highlighting the key ideas.",
            },
            {
              emoji: "📑",
              title: "Contract Analysis (Pro)",
              description:
                "Detect parties, obligations, payment terms, risks, and deadlines in legal contracts.",
            },
            {
              emoji: "💳",
              title: "Transparent Billing",
              description:
                "Free: 3 summaries/day. Pro: 200 included/month, then $0.05 per additional summary.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm"
            >
              <div className="text-3xl mb-3">{f.emoji}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
