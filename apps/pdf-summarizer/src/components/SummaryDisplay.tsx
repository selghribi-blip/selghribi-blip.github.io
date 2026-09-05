'use client';

import { useState } from 'react';

/**
 * Displays an AI-generated summary in a card.
 * Includes a copy-to-clipboard button.
 */
export default function SummaryDisplay({ summary }: { summary: string }) {
  const [copied, setCopied] = useState(false);

  /** Copies the summary text to the clipboard and shows a brief confirmation. */
  async function handleCopy() {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-indigo-700/50 bg-gray-900 p-6 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">AI Summary</h3>
        <button
          onClick={() => void handleCopy()}
          className="flex items-center gap-1.5 rounded-md border border-gray-700 px-3 py-1 text-xs text-gray-400 transition hover:border-gray-500 hover:text-white"
        >
          {copied ? (
            <>
              <span>✓</span> Copied!
            </>
          ) : (
            <>
              <span>📋</span> Copy
            </>
          )}
        </button>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
        {summary}
      </p>
    </div>
  );
}
