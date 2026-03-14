"use client";

import React, { useCallback, useRef, useState } from "react";

interface UploadDropzoneProps {
  plan: "FREE" | "PRO";
  onSummaryComplete: (result: SummaryResult) => void;
}

export interface SummaryResult {
  summary: string;
  textPreview: string;
  quota: {
    plan: "FREE" | "PRO";
    used: number;
    included: number;
    remaining: number;
    isOverage: boolean;
  };
}

/**
 * PDF upload dropzone with mode selector (general / contract).
 * Contract mode is disabled for Free plan users.
 */
export function UploadDropzone({ plan, onSummaryComplete }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"general" | "contract">("general");
  const [language, setLanguage] = useState<"auto" | "en" | "ar">("auto");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxMB = plan === "PRO" ? 35 : 5;

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file.");
        return;
      }
      if (file.size > maxMB * 1024 * 1024) {
        setError(`File too large. Your plan allows up to ${maxMB}MB.`);
        return;
      }

      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("mode", mode);
        formData.append("language", language);

        const res = await fetch("/api/summarize", { method: "POST", body: formData });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "An error occurred.");
          return;
        }
        onSummaryComplete(data as SummaryResult);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [mode, language, maxMB, onSummaryComplete],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("general")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === "general"
              ? "bg-brand-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          General Summary
        </button>
        <button
          type="button"
          onClick={() => {
            if (plan !== "PRO") return;
            setMode("contract");
          }}
          disabled={plan !== "PRO"}
          title={plan !== "PRO" ? "Contract mode requires Pro plan" : undefined}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === "contract"
              ? "bg-brand-600 text-white"
              : plan !== "PRO"
                ? "cursor-not-allowed bg-gray-50 text-gray-400"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Contract Mode {plan !== "PRO" && "🔒"}
        </button>
      </div>

      {/* Language selector */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Language:</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as "auto" | "en" | "ar")}
          className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="auto">Auto-detect</option>
          <option value="en">English</option>
          <option value="ar">Arabic</option>
        </select>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-colors ${
          isDragging ? "border-brand-500 bg-brand-50" : "border-gray-300 bg-gray-50 hover:border-brand-400"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <svg
              className="h-8 w-8 animate-spin text-brand-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <p className="text-sm text-gray-600">Generating summary…</p>
          </div>
        ) : (
          <>
            <svg className="mb-3 h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm font-medium text-gray-700">Drop your PDF here or click to browse</p>
            <p className="mt-1 text-xs text-gray-400">Max {maxMB}MB · PDF only</p>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
