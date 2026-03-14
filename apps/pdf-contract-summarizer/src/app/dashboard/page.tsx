import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getQuotaStatus } from "@/lib/quota";
import Link from "next/link";
import ManageBillingButton from "@/components/ManageBillingButton";

export const metadata = { title: "Dashboard · PDF & Contract Summarizer" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { checkout?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/dashboard");
  }

  const plan = ((session.user as { plan?: string }).plan ?? "free") as "free" | "pro";
  const quota = await getQuotaStatus(session.user.id, plan);

  const justUpgraded = searchParams.checkout === "success";

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto">
      {justUpgraded && (
        <div className="rounded-xl border border-green-300 bg-green-50 p-4 text-green-700 text-sm font-medium">
          🎉 Welcome to Pro! You now have {quota.limit} summaries per month with Contract Summary mode.
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Signed in as {session.user.email}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            plan === "pro"
              ? "bg-indigo-100 text-indigo-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {plan === "pro" ? "Pro" : "Free"} Plan
        </span>
      </div>

      {/* Usage card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-4">
        <h2 className="font-semibold text-gray-800">Usage This {plan === "pro" ? "Month" : "Day"}</h2>

        <div className="flex items-end gap-2">
          <span className="text-4xl font-extrabold text-indigo-600">{quota.used}</span>
          <span className="text-lg text-gray-400 mb-0.5">/ {quota.limit}</span>
          <span className="text-sm text-gray-500 mb-1 ml-1">summaries used</span>
        </div>

        {/* Progress bar */}
        <div className="w-full rounded-full bg-gray-200 h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all ${
              quota.exceeded ? "bg-red-500" : quota.remaining <= 1 ? "bg-amber-400" : "bg-indigo-500"
            }`}
            style={{ width: `${Math.min(100, (quota.used / quota.limit) * 100)}%` }}
          />
        </div>

        <p className="text-sm text-gray-600">
          <strong>{quota.remaining}</strong> summaries remaining{" "}
          {plan === "pro" ? "this month" : "today"}{" "}
          <span className="text-gray-400">({quota.period})</span>
        </p>

        {quota.exceeded && plan === "free" && (
          <a href="/pricing" className="text-sm text-indigo-600 underline font-semibold">
            Upgrade to Pro → 200 summaries/month
          </a>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <Link
          href="/summarize"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
        >
          New Summary
        </Link>

        {plan === "free" ? (
          <Link
            href="/pricing"
            className="rounded-xl border border-indigo-400 px-5 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition"
          >
            Upgrade to Pro
          </Link>
        ) : (
          <ManageBillingButton />
        )}
      </div>
    </div>
  );
}
