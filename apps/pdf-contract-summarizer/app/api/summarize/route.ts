import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractTextFromPdfBuffer } from "@/lib/pdf";
import { OpenAiProvider } from "@/lib/ai/openai";
import {
  checkSummaryAllowed,
  recordSummaryUsage,
} from "@/lib/stripe/billing";

export const runtime = "nodejs";

/**
 * POST /api/summarize
 * Accepts multipart/form-data with:
 *   file: PDF file
 *   mode: "general" | "contract"  (default: "general")
 *
 * Enforces server-side plan limits:
 *   Free  — 3/day, 5MB max, no contract mode
 *   Pro   — 200 included/month, 35MB max, contract mode allowed
 *           after 200, usage is billed at $0.05/request via Stripe metered
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const userId = session.user.id;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file");
  const modeRaw = formData.get("mode");
  const contractMode = modeRaw === "contract";

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing PDF file." }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "File must be a PDF." }, { status: 400 });
  }

  // Plan enforcement (size + mode + quota)
  const check = await checkSummaryAllowed(userId, {
    fileSize: file.size,
    contractMode,
  });

  if (!check.allowed) {
    return NextResponse.json({ error: check.reason }, { status: 403 });
  }

  // Extract text from PDF
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let text: string;
  try {
    text = await extractTextFromPdfBuffer(buffer);
  } catch {
    return NextResponse.json(
      { error: "Failed to read the PDF. It may be encrypted or corrupted." },
      { status: 422 }
    );
  }

  if (!text) {
    return NextResponse.json(
      { error: "No extractable text found in this PDF." },
      { status: 422 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server misconfiguration: missing AI key." },
      { status: 500 }
    );
  }

  // Generate summary
  const ai = new OpenAiProvider(apiKey);
  let summary: string;
  try {
    summary = await ai.summarizeText(text, {
      language: "auto",
      maxBullets: 8,
      mode: contractMode ? "contract" : "general",
    });
  } catch (err) {
    console.error("AI summarization error:", err);
    return NextResponse.json(
      { error: "AI summarization failed. Please try again." },
      { status: 502 }
    );
  }

  // Record usage (increments counter, creates Stripe overage record if needed)
  await recordSummaryUsage(userId, {
    fileSize: file.size,
    contractMode,
    isOverage: check.isOverage,
  });

  return NextResponse.json({
    summary,
    textPreview: text.slice(0, 2000),
    quota: {
      remaining: check.remaining,
      isOverage: check.isOverage,
    },
  });
}
