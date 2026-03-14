import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { asPlan } from "@/lib/limits";
import { PlanBadge } from "./PlanBadge";
import { signOut } from "@/lib/auth";

export async function Navbar() {
  const session = await auth();
  let planBadgeProps: { plan: "FREE" | "PRO"; isOverage?: boolean } = { plan: "FREE" };

  if (session?.user?.id) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });
    if (user) {
      planBadgeProps = { plan: asPlan(user.plan) };
    }
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-brand-600">
          PDF & Contract Summarizer
        </Link>

        <div className="flex items-center gap-4">
          {session?.user ? (
            <>
              <PlanBadge {...planBadgeProps} />
              <Link href="/dashboard" className="text-sm text-gray-700 hover:text-brand-600">
                Dashboard
              </Link>
              <Link href="/summarize" className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
                Summarize
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/pricing" className="text-sm text-gray-700 hover:text-brand-600">
                Pricing
              </Link>
              <Link href="/auth/sign-in" className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
