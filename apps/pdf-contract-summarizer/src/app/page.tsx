import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-3">
          <div className="text-6xl">📄</div>
          <h1 className="text-4xl font-black text-white">
            PDF &amp; Contract
            <br />
            <span className="bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
              Summarizer
            </span>
          </h1>
          <p className="text-slate-400 text-lg">
            Upload any PDF and get an AI-powered summary in seconds.
            Contract mode extracts key clauses, obligations, and risks.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
            <div className="text-2xl mb-1">📝</div>
            <div className="text-slate-300 font-medium">PDF Summary</div>
            <div className="text-slate-500 text-xs mt-1">General document summary</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
            <div className="text-2xl mb-1">📋</div>
            <div className="text-slate-300 font-medium">Contract Mode</div>
            <div className="text-slate-500 text-xs mt-1">Key clauses &amp; risks</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
            <div className="text-2xl mb-1">📊</div>
            <div className="text-slate-300 font-medium">History</div>
            <div className="text-slate-500 text-xs mt-1">All your past summaries</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
            <div className="text-2xl mb-1">🔒</div>
            <div className="text-slate-300 font-medium">Secure</div>
            <div className="text-slate-500 text-xs mt-1">Google/GitHub OAuth</div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-slate-400 text-sm">Sign in to get started</p>
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/dashboard" });
            }}
          >
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Continue with GitHub
            </button>
          </form>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </form>
        </div>

        <p className="text-xs text-slate-600">
          Free plan: 3 summaries/day · 5 MB max PDF
          <br />
          Pro plan: Unlimited · 20 MB · Contract mode
        </p>
      </div>
    </main>
  );
}
