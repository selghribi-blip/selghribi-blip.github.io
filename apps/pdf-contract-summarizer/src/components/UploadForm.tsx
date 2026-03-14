"use client";

import { useState, useRef } from "react";

interface UploadFormProps {
  onResult: (result: {
    summary: string;
    extractedPreview: string;
    filename: string;
    mode: string;
  }) => void;
  isPro: boolean;
}

export default function UploadForm({ onResult, isPro }: UploadFormProps) {
  const [mode, setMode] = useState<"pdf" | "contract">("pdf");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setProgress("");

    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError("File is too large (max 20 MB).");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);

    setLoading(true);
    setProgress("Uploading PDF...");

    try {
      setProgress("Extracting text from PDF...");
      const res = await fetch("/api/summarize", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setProgress("Done!");
      onResult(data);

      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          Summary mode
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setMode("pdf")}
            className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
              mode === "pdf"
                ? "bg-teal-500/20 border-teal-500 text-teal-400"
                : "border-white/10 text-slate-400 hover:border-white/30"
            }`}
          >
            📄 PDF Summary
          </button>
          <button
            type="button"
            onClick={() => (isPro ? setMode("contract") : null)}
            className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors relative ${
              mode === "contract"
                ? "bg-blue-500/20 border-blue-500 text-blue-400"
                : !isPro
                ? "border-white/10 text-slate-600 cursor-not-allowed"
                : "border-white/10 text-slate-400 hover:border-white/30"
            }`}
            title={!isPro ? "Contract mode requires Pro plan" : ""}
          >
            📋 Contract Summary
            {!isPro && (
              <span className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full font-bold">
                PRO
              </span>
            )}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          Upload PDF
        </label>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          required
          disabled={loading}
          className="block w-full text-sm text-slate-300
            file:mr-4 file:py-2 file:px-4
            file:rounded-xl file:border-0
            file:text-sm file:font-semibold
            file:bg-teal-500/20 file:text-teal-400
            hover:file:bg-teal-500/30
            disabled:opacity-50"
        />
        <p className="mt-1 text-xs text-slate-500">
          {isPro ? "Max 20 MB" : "Max 5 MB (Free plan). Upgrade for larger files."}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading && progress && (
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm flex items-center gap-2">
          <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />
          {progress}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-blue-500 text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Processing..." : "Summarize PDF"}
      </button>
    </form>
  );
}
