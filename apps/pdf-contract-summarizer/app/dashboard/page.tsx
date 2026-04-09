import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getQuotaInfo } from "@/lib/stripe/billing";
import { Navbar } from "@/components/Navbar";
import { QuotaBadge } from "@/components/QuotaBadge";
import { UploadForm } from "@/components/UploadForm";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/sign-in");

  const userId = session.user.id;
  const quota = await getQuotaInfo(userId);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userImage={session.user.image} userName={session.user.name} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <QuotaBadge quota={quota} />
        </div>

        {quota.plan === "free" && (
          <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4 mb-8 flex items-center justify-between">
            <p className="text-sm text-indigo-800">
              Upgrade to <strong>Pro</strong> for 200 summaries/month, 35MB
              PDFs, and contract analysis.
            </p>
            <form action="/api/stripe/checkout" method="POST">
              <button
                type="submit"
                className="ml-4 rounded-lg bg-indigo-600 px-4 py-2 text-white text-sm font-medium hover:bg-indigo-700"
              >
                Upgrade to Pro
              </button>
            </form>
          </div>
        )}

        {quota.isOverage && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-8">
            <p className="text-sm text-amber-800">
              ⚡ You have used all <strong>200 included summaries</strong> this
              month. Additional summaries are billed at{" "}
              <strong>$0.05 each</strong> via Stripe metered billing.
            </p>
          </div>
        )}

        <div className="rounded-2xl bg-white border border-gray-200 p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Upload PDF
          </h2>
          <UploadForm plan={quota.plan} />
        </div>

        {/* Manage billing link for Pro users */}
        {quota.plan === "pro" && (
          <div className="mt-6 text-center">
            <form action="/api/stripe/portal" method="POST">
              <button
                type="submit"
                className="text-sm text-gray-500 underline hover:text-gray-700"
              >
                Manage billing & subscription →
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
