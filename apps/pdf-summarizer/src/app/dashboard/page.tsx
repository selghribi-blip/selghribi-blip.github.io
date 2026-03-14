import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerAuthSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import type { SummaryRecord } from '@/types';

/**
 * Dashboard page — shows subscription status and the user's last 5 summaries.
 * Server component; redirects unauthenticated users to sign-in.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { success?: string };
}) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    redirect('/api/auth/signin?callbackUrl=/dashboard');
  }

  // Fetch subscription and recent summaries in parallel
  const [subscription, summaries] = await Promise.all([
    prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { status: true, currentPeriodEnd: true, stripeCustomerId: true },
    }),
    prisma.summary.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        filename: true,
        extractedText: true,
        summary: true,
        createdAt: true,
      },
    }),
  ]);

  const isActive = subscription?.status === 'ACTIVE';
  const successMessage = searchParams.success === 'true';

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* Success banner after Stripe checkout */}
      {successMessage && (
        <div className="mb-6 rounded-lg border border-green-700 bg-green-900/40 px-4 py-3 text-green-300">
          🎉 Subscription activated! You can now upload and summarize PDFs.
        </div>
      )}

      <h1 className="mb-8 text-3xl font-bold text-white">Dashboard</h1>

      {/* ── Subscription status card ─────────────────────────────── */}
      <div className="mb-10 rounded-xl border border-gray-800 bg-gray-900 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Subscription</h2>
            {subscription?.currentPeriodEnd && isActive && (
              <p className="mt-1 text-sm text-gray-400">
                Renews on{' '}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>
          <StatusBadge status={subscription?.status ?? 'INACTIVE'} />
        </div>

        <div className="mt-5 flex gap-3">
          {isActive && subscription?.stripeCustomerId ? (
            <ManageBillingButton />
          ) : (
            <Link
              href="/pricing"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Subscribe now
            </Link>
          )}
          <Link
            href="/upload"
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-300 hover:border-gray-500 hover:text-white"
          >
            New summary
          </Link>
        </div>
      </div>

      {/* ── Recent summaries ─────────────────────────────────────── */}
      <h2 className="mb-4 text-xl font-semibold text-white">Recent summaries</h2>
      {summaries.length === 0 ? (
        <p className="text-gray-400">
          No summaries yet.{' '}
          <Link href="/upload" className="text-indigo-400 hover:underline">
            Upload your first PDF
          </Link>
          .
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {(summaries as SummaryRecord[]).map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-gray-800 bg-gray-900 p-5"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium text-white">{s.filename}</span>
                <span className="text-xs text-gray-500">
                  {new Date(s.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="line-clamp-3 text-sm text-gray-400">{s.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Visual badge for subscription status */
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-green-900/50 text-green-300 ring-green-500/30',
    TRIALING: 'bg-blue-900/50 text-blue-300 ring-blue-500/30',
    PAST_DUE: 'bg-yellow-900/50 text-yellow-300 ring-yellow-500/30',
    CANCELED: 'bg-red-900/50 text-red-300 ring-red-500/30',
    INACTIVE: 'bg-gray-800 text-gray-400 ring-gray-600/30',
  };
  const cls = styles[status] ?? styles.INACTIVE;
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${cls}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

/** Client button that calls the portal API then redirects */
function ManageBillingButton() {
  // This is rendered inside a server component; we use a plain form POST to call the API
  return (
    <form action="/api/stripe/portal" method="POST">
      <button
        type="submit"
        className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-300 hover:border-gray-500 hover:text-white"
      >
        Manage billing
      </button>
    </form>
  );
}
