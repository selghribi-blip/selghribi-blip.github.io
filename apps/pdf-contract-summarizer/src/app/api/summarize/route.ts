/**
 * app/api/summarize/route.ts
 *
 * POST /api/summarize
 * Expects multipart/form-data with:
 *   - file  (PDF, max 5 MB free / 35 MB pro)
 *   - mode  "general" | "contract"  (contract = Pro only)
 *
 * Response (200):
 * {
 *   summary: string,
 *   textPreview: string,
 *   // Free:
 *   remaining_today?: number,
 *   // Pro:
 *   remaining_month_included?: number,
 *   overage_count_this_month?: number
 * }
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { extractTextFromPdfBuffer } from "@/lib/pdf";
import { OpenAiProvider } from "@/lib/ai/openai";
import { checkAndIncrementUsage } from "@/lib/usage";
import { PLAN_LIMITS, isProActive } from "@/lib/plans";
import { prisma } from "@/lib/db";
import type { SummaryMode } from "@/lib/ai/provider";

export async function POST(req: Request) {
  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // ── 2. Parse form data ─────────────────────────────────────────────────────
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = form.get("file");
  const modeRaw = form.get("mode");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing PDF file." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are accepted." }, { status: 400 });
  }

  const mode: SummaryMode =
    modeRaw === "contract" ? "contract" : "general";

  // ── 3. Resolve user plan & enforce file-size limit ─────────────────────────
  const dbUser = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { plan: true, subscriptionStatus: true, currentPeriodEnd: true },
  });

  const proActive = isProActive(
    dbUser.plan,
    dbUser.subscriptionStatus,
    dbUser.currentPeriodEnd ?? null
  );

  const maxBytes = proActive
    ? PLAN_LIMITS.PRO.maxFileSizeBytes
    : PLAN_LIMITS.FREE.maxFileSizeBytes;

  if (file.size > maxBytes) {
    const limitMB = Math.round(maxBytes / (1024 * 1024));
    const upgradeHint = proActive ? "" : " Upgrade to Pro for a 35 MB limit.";
    return NextResponse.json(
      { error: `File size exceeds the ${limitMB} MB limit for your plan.${upgradeHint}` },
      { status: 413 }
    );
  }

  // ── 4. Quota check + counter increment ────────────────────────────────────
  const usageResult = await checkAndIncrementUsage(userId, mode);
  if (!usageResult.allowed) {
    return NextResponse.json(
      { error: usageResult.reason },
      { status: usageResult.statusCode ?? 429 }
    );
  }

  // ── 5. Extract text ────────────────────────────────────────────────────────
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let text: string;
  try {
    text = await extractTextFromPdfBuffer(buffer);
  } catch {
    return NextResponse.json({ error: "Failed to parse the PDF file." }, { status: 422 });
  }

  if (!text) {
    return NextResponse.json(
      { error: "No extractable text found in this PDF." },
      { status: 422 }
    );
  }

  // ── 6. AI summarisation ────────────────────────────────────────────────────
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server not configured (missing AI key)." }, { status: 500 });
  }

  let summary: string;
  try {
    const ai = new OpenAiProvider(apiKey);
    summary = await ai.summarizeText(text, { mode, language: "auto" });
  } catch {
    return NextResponse.json(
      { error: "AI summarisation failed. Please try again." },
      { status: 502 }
    );
  }

  // ── 7. Return result + quota metadata ─────────────────────────────────────
  return NextResponse.json({
    summary,
    textPreview: text.slice(0, 1500),
    // Quota metadata
    ...(usageResult.remaining_today !== undefined && {
      remaining_today: usageResult.remaining_today,
    }),
    ...(usageResult.remaining_month_included !== undefined && {
      remaining_month_included: usageResult.remaining_month_included,
    }),
    ...(usageResult.overage_count_this_month !== undefined && {
      overage_count_this_month: usageResult.overage_count_this_month,
    }),
  });
}
