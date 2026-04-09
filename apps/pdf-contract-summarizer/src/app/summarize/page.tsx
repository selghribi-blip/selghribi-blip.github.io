import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getQuotaStatus } from "@/lib/quota";
import UploadDropzone from "@/components/UploadDropzone";
import QuotaBadge from "@/components/QuotaBadge";

export const metadata = { title: "Summarize · PDF & Contract Summarizer" };

export default async function SummarizePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/summarize");
  }

  const plan = ((session.user as { plan?: string }).plan ?? "free") as "free" | "pro";
  const quota = await getQuotaStatus(session.user.id, plan);

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Summarize a PDF</h1>
        <QuotaBadge />
      </div>

      {/* Quota banner when exhausted */}
      {quota.exceeded && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {plan === "pro" ? (
            <>
              You have used all <strong>{quota.limit} summaries</strong> for this month (
              {quota.period}). Your quota resets on the 1st of next month.
            </>
          ) : (
            <>
              You have used all <strong>{quota.limit} summaries</strong> for today ({quota.period}).
              Come back tomorrow, or{" "}
              <a href="/pricing" className="underline font-semibold">
                upgrade to Pro
              </a>{" "}
              for 200 summaries/month.
            </>
          )}
        </div>
      )}

      <UploadDropzone isPro={plan === "pro"} />
    </div>
  );
}
