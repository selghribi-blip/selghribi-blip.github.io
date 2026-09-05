import Link from "next/link";
import { auth, signIn, signOut } from "@/lib/auth";

export default async function Navbar() {
  const session = await auth();
  const plan = (session?.user as { plan?: string } | undefined)?.plan ?? "free";

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-bold text-gray-900 text-lg">
          📄 PDF & Contract Summarizer
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/summarize" className="text-gray-600 hover:text-gray-900">
            Summarize
          </Link>
          <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
            Pricing
          </Link>
          {session ? (
            <>
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  plan === "pro"
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {plan === "pro" ? "Pro" : "Free"}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut();
                }}
              >
                <button className="text-gray-500 hover:text-gray-900">Sign out</button>
              </form>
            </>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn();
              }}
            >
              <button className="rounded-lg bg-indigo-600 px-3 py-1.5 text-white font-semibold hover:bg-indigo-700 transition">
                Sign in
              </button>
            </form>
          )}
        </div>
      </div>
    </nav>
  );
}
