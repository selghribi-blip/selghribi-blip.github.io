import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/stripe";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard — PDF & Contract Summarizer",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, summaryCount: true, email: true },
  });

  const isPro = user?.plan === "pro";
  const limit = isPro ? PLANS.pro.includedSummaries : PLANS.free.includedSummaries;
  const count = user?.summaryCount ?? 0;

  return (
    <main className="dashboard-page" style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user.email}</p>

      <section style={{ margin: "2rem 0", padding: "1.5rem", background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb" }}>
        <h2>Your Plan</h2>
        <p>
          <strong>{isPro ? "Pro" : "Free"}</strong>
          {isPro && (
            <> — $19/month · {limit} summaries included · $0.05 per extra summary beyond {limit}</>
          )}
          {!isPro && (
            <> — {limit} summaries included</>
          )}
        </p>
        <p style={{ marginTop: "0.5rem" }}>
          Summaries used this month: <strong>{count}</strong> / {limit}
          {isPro && count > limit && (
            <span style={{ color: "#f59e0b", marginLeft: "0.5rem" }}>
              (+{count - limit} overage @ $0.05 each)
            </span>
          )}
        </p>
        {!isPro && (
          <form action="/api/stripe/checkout" method="POST" style={{ marginTop: "1rem" }}>
            <button type="submit" className="btn btn--primary">
              Upgrade to Pro — $19/month
            </button>
          </form>
        )}
      </section>

      <section style={{ padding: "1.5rem", background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb" }}>
        <h2>Summarize a Document</h2>
        <p style={{ marginBottom: "1rem", color: "#4b5563" }}>
          Upload a PDF or contract to get an AI-generated summary.
        </p>
        <form action="/api/summarize" method="POST" encType="multipart/form-data">
          <input type="file" name="file" accept="application/pdf" required />
          <button type="submit" className="btn btn--primary" style={{ marginTop: "0.75rem", display: "block" }}>
            Summarize
          </button>
        </form>
      </section>
    </main>
  );
}
