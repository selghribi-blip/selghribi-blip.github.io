/**
 * app/dashboard/page.tsx
 * Main app page: PDF upload + mode selector + summary display + quota indicator.
 */
"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, Suspense } from "react";
import Link from "next/link";
import { QuotaBadge } from "@/components/QuotaBadge";

type SummaryMode = "general" | "contract";

interface SummarizeResponse {
  summary?: string;
  textPreview?: string;
  error?: string;
  remaining_today?: number;
  remaining_month_included?: number;
  overage_count_this_month?: number;
}

interface QuotaState {
  remainingToday?: number;
  remainingMonthIncluded?: number;
  overageCountThisMonth?: number;
}

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<SummaryMode>("general");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummarizeResponse | null>(null);
  const [quota, setQuota] = useState<QuotaState>({});

  const plan = ((session?.user as { plan?: string })?.plan ?? "FREE") as "FREE" | "PRO";
  const isPro = plan === "PRO";

  // Redirect to sign-in if unauthenticated
  if (status === "unauthenticated") {
    router.push("/auth/sign-in");
    return null;
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setResult(null);

    const form = new FormData();
    form.append("file", file);
    form.append("mode", mode);

    const res = await fetch("/api/summarize", { method: "POST", body: form });
    const data: SummarizeResponse = await res.json();

    setResult(data);

    if (!data.error) {
      setQuota({
        remainingToday: data.remaining_today,
        remainingMonthIncluded: data.remaining_month_included,
        overageCountThisMonth: data.overage_count_this_month,
      });
    }

    setLoading(false);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") setFile(dropped);
  }, []);

  const checkoutSuccess = searchParams.get("checkout") === "success";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-brand-700">
          📄 PDF & Contract Summarizer
        </Link>
        <div className="flex items-center gap-4">
          {/* Quota badge */}
          {(quota.remainingToday !== undefined ||
            quota.remainingMonthIncluded !== undefined) && (
            <QuotaBadge
              plan={plan}
              remainingToday={quota.remainingToday}
              remainingMonthIncluded={quota.remainingMonthIncluded}
              overageCountThisMonth={quota.overageCountThisMonth}
            />
          )}

          {!isPro && (
            <Link
              href="/pricing"
              className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700"
            >
              Upgrade to Pro
            </Link>
          )}

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-12 px-4">
        {checkoutSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
            🎉 Welcome to Pro! Your subscription is now active.
          </div>
        )}

        <h1 className="text-2xl font-bold text-slate-800 mb-6">Summarise a PDF</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Mode selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Summary mode
            </label>
            <div className="flex gap-3">
              {(["general", "contract"] as const).map((m) => {
                const isContractLocked = m === "contract" && !isPro;
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={isContractLocked}
                    onClick={() => setMode(m)}
                    className={[
                      "flex-1 py-2.5 rounded-lg border text-sm font-medium transition",
                      mode === m
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-white text-slate-700 border-slate-200 hover:border-brand-400",
                      isContractLocked ? "opacity-50 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    {m === "general" ? "📄 General" : "⚖️ Contract"}
                    {isContractLocked && (
                      <span className="ml-1 text-xs text-amber-600">(Pro)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* File drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-brand-400 transition bg-white"
            onClick={() => document.getElementById("file-input")?.click()}
          >
            {file ? (
              <p className="text-sm text-slate-700 font-medium">{file.name}</p>
            ) : (
              <>
                <p className="text-slate-500 text-sm">
                  Drag & drop a PDF here, or click to select
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Max {isPro ? "35" : "5"} MB
                </p>
              </>
            )}
            <input
              id="file-input"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full bg-brand-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-brand-700 transition"
          >
            {loading ? "Summarising…" : "Summarise PDF"}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div className="mt-8">
            {result.error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {result.error}
                {result.error.toLowerCase().includes("pro") && (
                  <Link href="/pricing" className="ml-2 underline font-medium">
                    Upgrade to Pro
                  </Link>
                )}
              </div>
            ) : (
              <div className="bg-white border rounded-xl p-6 shadow-sm">
                <h2 className="font-semibold text-slate-800 mb-4">📝 Summary</h2>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-slate-700">
                  {result.summary}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
