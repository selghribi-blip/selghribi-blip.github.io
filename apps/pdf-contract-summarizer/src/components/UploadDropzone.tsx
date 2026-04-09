"use client";

import { useState, useRef } from "react";
import type { SummaryMode } from "@/lib/ai/provider";

interface SummarizeResult {
  summary: string;
  mode: SummaryMode;
  textPreview: string;
  quota: {
    plan: string;
    used: number;
    limit: number;
    remaining: number;
    period: string;
  };
}

interface Props {
  /** Whether the current user is on the Pro plan */
  isPro: boolean;
}

export default function UploadDropzone({ isPro }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<SummaryMode>("general");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummarizeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<SummarizeResult["quota"] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
    setError(null);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") {
      setFile(f);
      setResult(null);
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const form = new FormData();
    form.append("file", file);
    form.append("mode", mode);

    try {
      const res = await fetch("/api/summarize", { method: "POST", body: form });
      const data = await res.json() as Record<string, unknown>;

      if (!res.ok) {
        setError((data.error as string) ?? "An error occurred.");
        if (data.quota) setQuotaInfo(data.quota as SummarizeResult["quota"]);
        return;
      }

      setResult(data as unknown as SummarizeResult);
      setQuotaInfo((data as unknown as SummarizeResult).quota);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isPro_ = isPro;

  return (
    <div className="flex flex-col gap-6">
      {/* Quota display */}
      {quotaInfo && (
        <div
          className={`rounded-xl border px-4 py-2 text-sm ${
            quotaInfo.remaining === 0
              ? "border-red-300 bg-red-50 text-red-700"
              : quotaInfo.remaining <= 1
                ? "border-amber-300 bg-amber-50 text-amber-700"
                : "border-green-300 bg-green-50 text-green-700"
          }`}
        >
          <span className="font-semibold capitalize">{quotaInfo.plan} plan</span> ·{" "}
          <strong>{quotaInfo.remaining}</strong> / {quotaInfo.limit} remaining{" "}
          {quotaInfo.plan === "pro" ? "this month" : "today"} ({quotaInfo.period})
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-10 text-center hover:bg-gray-100 transition"
        >
          {file ? (
            <p className="font-medium text-gray-700">📄 {file.name}</p>
          ) : (
            <>
              <p className="text-gray-500">Drop a PDF here or click to browse</p>
              <p className="mt-1 text-xs text-gray-400">
                Max size: {isPro_ ? "25 MB (Pro)" : "5 MB (Free)"}
              </p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Mode selector */}
        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="general"
              checked={mode === "general"}
              onChange={() => setMode("general")}
              className="accent-indigo-600"
            />
            <span className="text-sm">General Summary</span>
          </label>

          <label
            className={`flex items-center gap-2 ${isPro_ ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
            title={!isPro_ ? "Contract mode is a Pro feature" : undefined}
          >
            <input
              type="radio"
              name="mode"
              value="contract"
              checked={mode === "contract"}
              onChange={() => isPro_ && setMode("contract")}
              disabled={!isPro_}
              className="accent-indigo-600"
            />
            <span className="text-sm">
              Contract Summary{" "}
              {!isPro_ && (
                <a href="/pricing" className="text-indigo-600 underline">
                  (Pro)
                </a>
              )}
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={!file || loading}
          className="w-full rounded-xl bg-indigo-600 py-2.5 font-semibold text-white disabled:opacity-50 hover:bg-indigo-700 transition"
        >
          {loading ? "Summarizing…" : "Summarize PDF"}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 capitalize">
              {result.mode} summary
            </span>
          </div>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-800">
            {result.summary}
          </div>
        </div>
      )}
    </div>
  );
}
