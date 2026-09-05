import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkQuota, asPlan } from "@/lib/limits";
import { stripe } from "@/lib/stripe/stripe";
import { QuotaDisplay } from "@/components/QuotaDisplay";
import { PlanBadge } from "@/components/PlanBadge";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, name: true, email: true },
  });
  if (!user) return null;

  const plan = asPlan(user.plan);
  const quota = await checkQuota(session.user.id, plan, false);
  const quotaData = quota.allowed
    ? quota
    : { plan: plan, used: 0, included: 0, remaining: 0, isOverage: false };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <PlanBadge plan={plan} isOverage={quotaData.isOverage} />
      </div>

      {/* Quota card */}
      <QuotaDisplay
        plan={quotaData.plan}
        used={quotaData.used}
        included={quotaData.included}
        remaining={quotaData.remaining}
        isOverage={quotaData.isOverage}
      />

      <div className="mt-6 flex gap-4">
        <Link
          href="/summarize"
          className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          New Summary
        </Link>
        {plan === "FREE" ? (
          <Link
            href="/pricing"
            className="rounded-xl border border-brand-500 px-6 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50"
          >
            Upgrade to Pro
          </Link>
        ) : (
          <form
            action={async () => {
              "use server";
              // Direct server-side call to Stripe — no internal HTTP round-trip needed
              const session = await auth();
              if (!session?.user?.id) return;
              const u = await db.user.findUnique({
                where: { id: session.user.id },
                select: { stripeCustomerId: true },
              });
              if (!u?.stripeCustomerId) return;
              const appUrl = process.env.APP_URL || "http://localhost:3000";
              const portalSession = await stripe.billingPortal.sessions.create({
                customer: u.stripeCustomerId,
                return_url: `${appUrl}/dashboard`,
              });
              redirect(portalSession.url);
            }}
          >
            <button
              type="submit"
              className="rounded-xl border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Manage Billing
            </button>
          </form>
        )}
      </div>

      {/* Overage explanation */}
      {plan === "PRO" && quotaData.isOverage && (
        <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <h3 className="mb-1 font-semibold text-orange-800">⚡ Overage billing is active</h3>
          <p className="text-sm text-orange-700">
            You&apos;ve used all 200 included summaries this month. Each additional summary is billed at
            <strong> $0.05</strong> via your Stripe subscription (metered billing).
            Usage is reported to Stripe after each summary and appears on your next invoice.
          </p>
        </div>
      )}
    </div>
  );
}
