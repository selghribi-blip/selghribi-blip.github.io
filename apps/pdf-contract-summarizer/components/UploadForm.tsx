"use client";

import { useState } from "react";

type Props = {
  plan: "free" | "pro";
};

export function UploadForm({ plan }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"general" | "contract">("general");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    summary: string;
    quota: { remaining: number | null; isOverage: boolean };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);

    const res = await fetch("/api/summarize", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
    } else {
      setResult(data);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mode selector */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            value="general"
            checked={mode === "general"}
            onChange={() => setMode("general")}
            className="accent-indigo-600"
          />
          <span>General Summary</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            value="contract"
            checked={mode === "contract"}
            onChange={() => setMode("contract")}
            disabled={plan !== "pro"}
            className="accent-indigo-600 disabled:cursor-not-allowed"
          />
          <span className={plan !== "pro" ? "text-gray-400" : ""}>
            Contract Analysis {plan !== "pro" && "(Pro only)"}
          </span>
        </label>
      </div>

      {/* File input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload PDF ({plan === "pro" ? "max 35MB" : "max 5MB"})
        </label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!file || loading}
        className="w-full rounded-xl bg-indigo-600 py-3 px-6 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Summarizing…" : "Summarize PDF"}
      </button>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {result.quota.isOverage && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-800 text-sm">
              ⚡ Overage billing active — this summary will be charged at $0.05.
            </div>
          )}
          {result.quota.remaining !== null && (
            <p className="text-sm text-gray-500">
              Remaining quota: {result.quota.remaining}
            </p>
          )}
          <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Summary</h3>
            <div className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
              {result.summary}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
