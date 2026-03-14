"use client";

import { useState } from "react";

interface SummaryResultProps {
  result: {
    summary: string;
    extractedPreview: string;
    filename: string;
    mode: string;
  };
  onClose: () => void;
}

export default function SummaryResult({ result, onClose }: SummaryResultProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg text-white">
            {result.mode === "contract" ? "📋 Contract Analysis" : "📄 PDF Summary"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{result.filename}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 text-sm border border-white/10 px-3 py-1 rounded-lg transition-colors"
        >
          New PDF
        </button>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="w-full px-4 py-3 flex items-center justify-between text-sm text-slate-400 hover:text-white bg-white/5 transition-colors"
        >
          <span>Extracted text preview (first 500 chars)</span>
          <span>{showPreview ? "▲" : "▼"}</span>
        </button>
        {showPreview && (
          <div className="px-4 py-3 text-xs text-slate-500 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
            {result.extractedPreview}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4">
        <h3 className="font-semibold text-teal-400 text-sm mb-3">AI Summary</h3>
        <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
          {result.summary}
        </div>
      </div>
    </div>
  );
}
