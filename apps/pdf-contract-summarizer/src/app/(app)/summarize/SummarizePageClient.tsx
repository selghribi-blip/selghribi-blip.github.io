"use client";

import React, { useState } from "react";
import { UploadDropzone, type SummaryResult } from "@/components/UploadDropzone";
import { QuotaDisplay } from "@/components/QuotaDisplay";

interface SummarizePageClientProps {
  plan: "FREE" | "PRO";
  initialQuota: {
    plan: "FREE" | "PRO";
    used: number;
    included: number;
    remaining: number;
    isOverage: boolean;
  };
}

export function SummarizePageClient({ plan, initialQuota }: SummarizePageClientProps) {
  const [quota, setQuota] = useState(initialQuota);
  const [result, setResult] = useState<SummaryResult | null>(null);

  const handleComplete = (data: SummaryResult) => {
    setResult(data);
    setQuota(data.quota);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900">New Summary</h1>

      <QuotaDisplay
        plan={quota.plan}
        used={quota.used}
        included={quota.included}
        remaining={quota.remaining}
        isOverage={quota.isOverage}
      />

      <UploadDropzone plan={plan} onSummaryComplete={handleComplete} />

      {result && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Summary</h2>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">
            {result.summary}
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
              Show extracted text preview
            </summary>
            <pre className="mt-2 max-h-48 overflow-y-auto rounded bg-gray-50 p-3 text-xs text-gray-600">
              {result.textPreview}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
