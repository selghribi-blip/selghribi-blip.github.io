"use client";

import { useState } from "react";
import UploadForm from "@/components/UploadForm";
import SummaryResult from "@/components/SummaryResult";
import { PLAN_LIMITS } from "@/lib/limits";

interface DashboardClientProps {
  plan: string;
  todaySummaries: number;
}

type SummaryResultData = {
  summary: string;
  extractedPreview: string;
  filename: string;
  mode: string;
};

export default function DashboardClient({
  plan,
  todaySummaries,
}: DashboardClientProps) {
  const [result, setResult] = useState<SummaryResultData | null>(null);
  const isPro = plan === "pro";
  const limits = PLAN_LIMITS[plan as "free" | "pro"] ?? PLAN_LIMITS.free;
  const dailyLimit = limits.dailySummaries === Infinity ? null : limits.dailySummaries;

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Upload a PDF to get an AI-powered summary
        </p>
      </div>

      {!isPro && dailyLimit && (
        <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-400">Daily summaries used</span>
            <span className={todaySummaries >= dailyLimit ? "text-red-400" : "text-teal-400"}>
              {todaySummaries} / {dailyLimit}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                todaySummaries >= dailyLimit ? "bg-red-500" : "bg-teal-500"
              }`}
              style={{ width: `${Math.min((todaySummaries / dailyLimit) * 100, 100)}%` }}
            />
          </div>
          {todaySummaries >= dailyLimit && (
            <p className="text-xs text-red-400 mt-2">
              Daily limit reached.{" "}
              <a href="/billing" className="underline hover:text-red-300">
                Upgrade to Pro
              </a>{" "}
              for unlimited summaries.
            </p>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
        {result ? (
          <SummaryResult result={result} onClose={() => setResult(null)} />
        ) : (
          <UploadForm onResult={setResult} isPro={isPro} />
        )}
      </div>

      <p className="text-center text-sm text-slate-500">
        View all your past summaries in{" "}
        <a href="/history" className="text-teal-400 hover:text-teal-300">
          History
        </a>
      </p>
    </main>
  );
}
