/**
 * POST /api/summarize
 *
 * Accepts multipart/form-data with:
 *   - file  : PDF file
 *   - mode  : "general" (default) | "contract" (Pro only)
 *
 * Enforces usage quotas:
 *   - Free : 3 summaries / day
 *   - Pro  : 200 summaries / month
 *
 * Returns:
 *   200  { summary, textPreview, quota }
 *   400  { error }
 *   402  { error, quota }  – quota exceeded
 *   403  { error }         – contract mode attempted on free plan
 *   413  { error }         – file too large
 *   422  { error }         – no text found in PDF
 *   500  { error }
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractTextFromPdfBuffer, FREE_MAX_PDF_BYTES, PRO_MAX_PDF_BYTES } from "@/lib/pdf";
import { OpenAiProvider } from "@/lib/ai/openai";
import {
  checkAndIncrementQuota,
  getQuotaStatus,
  QuotaExceededError,
} from "@/lib/quota";
import type { SummaryMode } from "@/lib/ai/provider";

export async function POST(req: Request) {
  try {
    // ── 1. Authentication ──────────────────────────────────────────────────
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be signed in to use this service." }, { status: 401 });
    }

    const userId = session.user.id;
    const plan = (session.user.plan ?? "free") as "free" | "pro";

    // ── 2. Parse multipart form ────────────────────────────────────────────
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid request: could not parse form data." }, { status: 400 });
    }

    const file = form.get("file");
    const rawMode = (form.get("mode") ?? "general") as string;
    const mode: SummaryMode = rawMode === "contract" ? "contract" : "general";

    // ── 3. Validate file ───────────────────────────────────────────────────
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing PDF file. Send a 'file' field in the form." }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "File must be a PDF (application/pdf)." }, { status: 400 });
    }

    // ── 4. Plan-gated validations ─────────────────────────────────────────

    // Contract mode is Pro-only.
    if (mode === "contract" && plan !== "pro") {
      return NextResponse.json(
        {
          error: "Contract Summary mode is a Pro feature. Upgrade to Pro to unlock it.",
          upgradeUrl: "/pricing",
        },
        { status: 403 }
      );
    }

    // PDF size limit depends on plan.
    const maxBytes = plan === "pro" ? PRO_MAX_PDF_BYTES : FREE_MAX_PDF_BYTES;
    if (file.size > maxBytes) {
      const maxMb = maxBytes / (1024 * 1024);
      return NextResponse.json(
        {
          error: `PDF exceeds the ${maxMb} MB size limit for your plan.`,
          ...(plan === "free" && { upgradeUrl: "/pricing" }),
        },
        { status: 413 }
      );
    }

    // ── 5. Quota check & increment ─────────────────────────────────────────
    let quota;
    try {
      quota = await checkAndIncrementQuota(userId, plan);
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        const currentQuota = await getQuotaStatus(userId, plan);
        return NextResponse.json(
          {
            error: err.message,
            quota: {
              plan: currentQuota.plan,
              period: currentQuota.period,
              used: currentQuota.used,
              limit: currentQuota.limit,
              remaining: 0,
            },
            ...(plan === "free" && { upgradeUrl: "/pricing" }),
          },
          { status: 402 }
        );
      }
      throw err;
    }

    // ── 6. Extract text from PDF ───────────────────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text: string;
    try {
      text = await extractTextFromPdfBuffer(buffer);
    } catch {
      return NextResponse.json({ error: "Failed to read the PDF file. It may be corrupted or encrypted." }, { status: 422 });
    }

    if (!text || text.length < 10) {
      return NextResponse.json({ error: "No readable text found in this PDF. It may be a scanned image." }, { status: 422 });
    }

    // ── 7. AI summarization ────────────────────────────────────────────────
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server configuration error: missing AI API key." }, { status: 500 });
    }

    const ai = new OpenAiProvider(apiKey);
    const summary = await ai.summarizeText(text, {
      language: "auto",
      maxBullets: 8,
      mode,
    });

    // ── 8. Return result with quota info ───────────────────────────────────
    return NextResponse.json({
      summary,
      mode,
      textPreview: text.slice(0, 500),
      quota: {
        plan: quota.plan,
        period: quota.period,
        used: quota.used,
        limit: quota.limit,
        remaining: quota.remaining,
      },
    });
  } catch (err) {
    console.error("[/api/summarize]", err);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}
