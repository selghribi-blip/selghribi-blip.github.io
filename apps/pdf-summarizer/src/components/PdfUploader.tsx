'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import SummaryDisplay from './SummaryDisplay';
import type { UploadResponse, SummarizeResponse, SubscriptionRequiredError } from '@/types';

type Step = 'idle' | 'extracting' | 'summarizing' | 'done' | 'error';

/**
 * Main PDF upload widget.
 * Supports drag-and-drop and manual file selection.
 * Walks the user through extraction and summarization steps with live status feedback.
 */
export default function PdfUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [needsSubscription, setNeedsSubscription] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState('');
  const [fullText, setFullText] = useState('');
  const [summary, setSummary] = useState('');
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  /** Validates that the chosen file is a PDF and within the 10 MB limit */
  function validateFile(f: File): string | null {
    if (f.type !== 'application/pdf') return 'Only PDF files are supported.';
    if (f.size > 10 * 1024 * 1024) return 'File must be under 10 MB.';
    return null;
  }

  /** Handles file selection from the input or drag-and-drop */
  function handleFileChange(f: File) {
    const validationError = validateFile(f);
    if (validationError) {
      setErrorMsg(validationError);
      setStep('error');
      return;
    }
    setFile(f);
    setStep('idle');
    setErrorMsg('');
    setSummary('');
    setExtractedPreview('');
    setNeedsSubscription(false);
  }

  /** Drag-and-drop handlers */
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }
  function onDragLeave() {
    setIsDragging(false);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileChange(dropped);
  }

  /** Main handler: extracts text then generates summary */
  async function handleSubmit() {
    if (!file) return;
    setErrorMsg('');
    setNeedsSubscription(false);
    setSummary('');

    // ── Step 1: Extract text ────────────────────────────────────────
    setStep('extracting');
    const formData = new FormData();
    formData.append('file', file);

    let uploadRes: Response;
    try {
      uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
    } catch {
      setErrorMsg('Network error while uploading. Please try again.');
      setStep('error');
      return;
    }

    if (!uploadRes.ok) {
      const body = (await uploadRes.json()) as { error?: string };
      setErrorMsg(body.error ?? 'Failed to extract text from PDF.');
      setStep('error');
      return;
    }

    const uploadData = (await uploadRes.json()) as UploadResponse;
    setFullText(uploadData.text);
    setExtractedPreview(uploadData.text.slice(0, 500));

    // ── Step 2: Summarize ───────────────────────────────────────────
    setStep('summarizing');
    let summarizeRes: Response;
    try {
      summarizeRes = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: uploadData.text, filename: file.name }),
      });
    } catch {
      setErrorMsg('Network error while summarizing. Please try again.');
      setStep('error');
      return;
    }

    // 402 means the user needs a subscription
    if (summarizeRes.status === 402) {
      const body = (await summarizeRes.json()) as SubscriptionRequiredError;
      setNeedsSubscription(true);
      setErrorMsg(body.error ?? 'Subscription required.');
      setStep('error');
      return;
    }

    if (!summarizeRes.ok) {
      const body = (await summarizeRes.json()) as { error?: string };
      setErrorMsg(body.error ?? 'Failed to generate summary.');
      setStep('error');
      return;
    }

    const { summary: generatedSummary } = (await summarizeRes.json()) as SummarizeResponse;
    setSummary(generatedSummary);
    setStep('done');
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Drop zone ──────────────────────────────────────────────── */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition ${
          isDragging
            ? 'border-indigo-400 bg-indigo-950/30'
            : 'border-gray-700 bg-gray-900 hover:border-gray-600'
        }`}
      >
        <span className="mb-3 text-4xl">📂</span>
        {file ? (
          <div>
            <p className="font-medium text-white">{file.name}</p>
            <p className="text-sm text-gray-400">
              {(file.size / 1024).toFixed(1)} KB — click or drag to replace
            </p>
          </div>
        ) : (
          <div>
            <p className="font-medium text-gray-300">
              Drag &amp; drop a PDF here
            </p>
            <p className="text-sm text-gray-500">or click to browse — max 10 MB</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileChange(f);
          }}
        />
      </div>

      {/* ── Action button ──────────────────────────────────────────── */}
      {file && step !== 'done' && (
        <button
          onClick={() => void handleSubmit()}
          disabled={step === 'extracting' || step === 'summarizing'}
          className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {step === 'extracting'
            ? 'Extracting text…'
            : step === 'summarizing'
            ? 'Summarizing with AI…'
            : 'Extract & Summarize'}
        </button>
      )}

      {/* ── Status indicator ───────────────────────────────────────── */}
      {(step === 'extracting' || step === 'summarizing') && (
        <div className="flex items-center gap-2 text-sm text-indigo-300">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
          {step === 'extracting' ? 'Extracting text from PDF…' : 'Summarizing with AI…'}
        </div>
      )}

      {/* ── Error message ──────────────────────────────────────────── */}
      {step === 'error' && errorMsg && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {errorMsg}
          {needsSubscription && (
            <span>
              {' '}
              <Link
                href="/pricing"
                className="font-semibold text-indigo-400 underline hover:text-indigo-300"
              >
                Upgrade to Pro →
              </Link>
            </span>
          )}
        </div>
      )}

      {/* ── Extracted text preview ─────────────────────────────────── */}
      {extractedPreview && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <button
            onClick={() => setIsPreviewExpanded((v) => !v)}
            className="flex w-full items-center justify-between text-sm font-medium text-gray-300 hover:text-white"
          >
            <span>Extracted text preview</span>
            <span>{isPreviewExpanded ? '▲ Hide' : '▼ Show'}</span>
          </button>
          {isPreviewExpanded && (
            <p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-gray-400">
              {extractedPreview}
              {fullText.length > 500 && (
                <span className="text-gray-600"> … (truncated for preview)</span>
              )}
            </p>
          )}
        </div>
      )}

      {/* ── Summary result ─────────────────────────────────────────── */}
      {step === 'done' && summary && (
        <>
          <SummaryDisplay summary={summary} />
          <button
            onClick={() => {
              setStep('idle');
              setFile(null);
              setSummary('');
              setExtractedPreview('');
              setFullText('');
            }}
            className="text-sm text-gray-500 hover:text-gray-300"
          >
            ← Summarize another PDF
          </button>
        </>
      )}
    </div>
  );
}
