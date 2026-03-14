'use client';

import { useState, useRef } from 'react';
import type { PlanName } from '@/lib/stripe';

interface SummaryResult {
  summary: string;
  truncated: boolean;
  plan: PlanName;
  usage: { used: number; limit: number } | null;
}

interface RateLimitError {
  error: string;
  used: number;
  limit: number;
  resetAt: number;
  upgradeUrl: string;
}

type SummarizeMode = 'standard' | 'contract';

interface Props {
  planName: PlanName;
  canUseContractMode: boolean;
}

export function SummarizerClient({ planName, canUseContractMode }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<SummarizeMode>('standard');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState<RateLimitError | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.type !== 'application/pdf') {
        setError('Only PDF files are supported.');
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        setError('File too large. Maximum size is 10 MB.');
        return;
      }
      setFile(selected);
      setError(null);
      setResult(null);
      setRateLimited(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      if (dropped.type !== 'application/pdf') {
        setError('Only PDF files are supported.');
        return;
      }
      setFile(dropped);
      setError(null);
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setRateLimited(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.status === 429) {
        setRateLimited(data as RateLimitError);
        return;
      }

      if (!response.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setResult(data as SummaryResult);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setRateLimited(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Upload panel */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload PDF</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              file
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            {file ? (
              <div>
                <div className="text-4xl mb-2">📄</div>
                <p className="font-medium text-gray-900 text-sm truncate max-w-xs mx-auto">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-2">📁</div>
                <p className="font-medium text-gray-700">Drop your PDF here</p>
                <p className="text-sm text-gray-500 mt-1">or click to browse — max 10 MB</p>
              </div>
            )}
          </div>

          {/* Mode selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Summary Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('standard')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  mode === 'standard'
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                📄 Standard
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!canUseContractMode) {
                    window.location.href = '/pricing';
                    return;
                  }
                  setMode('contract');
                }}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors relative ${
                  mode === 'contract'
                    ? 'bg-primary-500 text-white border-primary-500'
                    : canUseContractMode
                    ? 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                }`}
              >
                ⚖️ Contract
                {!canUseContractMode && (
                  <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-xs px-1 rounded-full">
                    PRO
                  </span>
                )}
              </button>
            </div>
            {mode === 'contract' && (
              <p className="text-xs text-gray-500 mt-2">
                Extracts parties, obligations, payment terms, termination clauses, and risk flags.
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!file || loading}
            className="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Summarizing…
              </span>
            ) : (
              'Summarize PDF'
            )}
          </button>
        </form>
      </div>

      {/* Result panel */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Rate limit hit */}
        {rateLimited && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-4">
            <p className="font-medium text-orange-800 mb-2">Daily limit reached</p>
            <p className="text-sm text-orange-700 mb-3">
              You&apos;ve used {rateLimited.used}/{rateLimited.limit} summaries today. Resets at
              midnight UTC.
            </p>
            <a
              href="/pricing"
              className="inline-block bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              Upgrade to Pro — Unlimited summaries
            </a>
          </div>
        )}

        {/* Empty state */}
        {!error && !rateLimited && !result && !loading && (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm">Upload a PDF to see the summary here.</p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <div className="text-4xl mb-3 animate-bounce">🤖</div>
            <p className="text-sm">Analysing your document…</p>
          </div>
        )}

        {/* Success result */}
        {result && (
          <div>
            {result.truncated && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-700 mb-3">
                ⚠️ Document was truncated to the first 15,000 characters for processing.
              </div>
            )}
            <div className="prose prose-sm max-w-none">
              {result.summary.split('\n').map((line, i) =>
                line.trim() ? (
                  <p key={i} className="text-gray-700 mb-2 text-sm leading-relaxed">
                    {line}
                  </p>
                ) : (
                  <br key={i} />
                )
              )}
            </div>

            {result.usage && planName === 'FREE' && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                {result.usage.used}/{result.usage.limit} summaries used today ·{' '}
                <a href="/pricing" className="underline">
                  Upgrade for unlimited
                </a>
              </div>
            )}

            <button
              onClick={handleReset}
              className="mt-4 text-sm text-gray-500 underline hover:text-gray-700"
            >
              Summarize another PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
