import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="text-center py-16">
      <div className="inline-block bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
        🇲🇦 Made in Morocco
      </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-4">PDF & Contract Summarizer</h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        Upload any PDF and get an AI-powered summary in seconds. Powerful Contract Mode available for
        Pro users — extracts parties, obligations, payment terms, and risk clauses.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
        <Link
          href="/dashboard"
          className="bg-primary-500 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-600 transition-colors"
        >
          Start Summarizing
        </Link>
        <Link
          href="/pricing"
          className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:border-gray-400 transition-colors"
        >
          View Plans
        </Link>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl mb-3">📄</div>
          <h3 className="font-semibold text-gray-900 mb-2">Standard Summary</h3>
          <p className="text-gray-600 text-sm">
            Upload any PDF and get a concise 3–5 paragraph summary instantly.
          </p>
          <div className="mt-3 text-xs text-green-600 font-medium">✓ Free plan — 5/day</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl mb-3">⚖️</div>
          <h3 className="font-semibold text-gray-900 mb-2">Contract Mode</h3>
          <p className="text-gray-600 text-sm">
            Extract parties, obligations, payment terms, termination clauses and risk flags.
          </p>
          <div className="mt-3 text-xs text-orange-600 font-medium">🔒 Pro plan only</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl mb-3">🔐</div>
          <h3 className="font-semibold text-gray-900 mb-2">Secure & Private</h3>
          <p className="text-gray-600 text-sm">
            Sign in with GitHub or Google. Files are processed and immediately discarded.
          </p>
          <div className="mt-3 text-xs text-blue-600 font-medium">OAuth 2.0 authentication</div>
        </div>
      </div>
    </div>
  );
}
