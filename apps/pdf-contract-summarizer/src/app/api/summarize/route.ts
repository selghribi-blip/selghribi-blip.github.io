import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { extractTextFromPdfBuffer } from "@/lib/pdf";
import { OpenAiProvider } from "@/lib/ai/openai";
import { checkQuota, incrementUsage, getMonthKeyUTC, asPlan } from "@/lib/limits";
import { reportOverageUsage } from "@/lib/stripe/billing";
import { PLANS } from "@/lib/stripe/plans";
import type { SummaryMode } from "@/lib/ai/provider";

/**
 * POST /api/summarize
 *
 * Accepts multipart/form-data with:
 *   - file: PDF file (application/pdf)
 *   - mode: "general" | "contract"  (default: "general")
 *   - language: "auto" | "en" | "ar" (default: "auto")
 */
export async function POST(req: Request) {
  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  const userId = session.user.id;

  // 2. Fetch user plan from DB
  const user = await db.user.findUnique({ where: { id: userId }, select: { plan: true } });
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  const plan = asPlan(user.plan); // "FREE" | "PRO"

  // 3. Parse form data
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart/form-data." }, { status: 400 });
  }

  const file = form.get("file");
  const rawMode = (form.get("mode") as string) || "general";
  const language = (form.get("language") as string) || "auto";
  const mode: SummaryMode = rawMode === "contract" ? "contract" : "general";
  const isContractMode = mode === "contract";

  // 4. File validation
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing PDF file." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "File must be a PDF (application/pdf)." }, { status: 400 });
  }

  // 5. File size limit (plan-dependent)
  const maxBytes =
    plan === "PRO" ? PLANS.pro.maxFileSizeBytes : PLANS.free.maxFileSizeBytes;
  if (file.size > maxBytes) {
    const maxMB = maxBytes / (1024 * 1024);
    return NextResponse.json(
      { error: `PDF is too large. Your plan allows up to ${maxMB}MB.` },
      { status: 413 },
    );
  }

  // 6. Quota check (also blocks contract mode for Free)
  const quota = await checkQuota(userId, plan, isContractMode);
  if (!quota.allowed) {
    return NextResponse.json({ error: quota.reason }, { status: 403 });
  }

  // 7. Extract text
  const buffer = Buffer.from(await file.arrayBuffer());
  const text = await extractTextFromPdfBuffer(buffer);
  if (!text) {
    return NextResponse.json({ error: "No text found in this PDF." }, { status: 422 });
  }

  // 8. AI summary
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server configuration error (missing AI key)." }, { status: 500 });
  }
  const ai = new OpenAiProvider(apiKey);
  const summary = await ai.summarizeText(text, {
    mode,
    language: language as "auto" | "en" | "ar",
    maxBullets: 8,
  });

  // 9. Increment usage counter and get new total
  const newCount = await incrementUsage(userId, plan);

  // 10. If Pro user is now in overage territory, report to Stripe (idempotent)
  if (plan === "PRO" && newCount > PLANS.pro.summariesPerMonth) {
    const monthKey = getMonthKeyUTC();
    // Fire-and-forget; don't fail the summary if billing reporting fails
    reportOverageUsage(userId, monthKey, newCount).catch((err) => {
      console.error("[overage] Failed to report usage to Stripe:", err);
    });
  }

  // 11. Build updated quota for UI
  const updatedUsed = newCount;
  const isNowOverage = plan === "PRO" && updatedUsed > PLANS.pro.summariesPerMonth;

  return NextResponse.json({
    summary,
    textPreview: text.slice(0, 2000),
    quota: {
      plan,
      used: updatedUsed,
      included: plan === "PRO" ? PLANS.pro.summariesPerMonth : PLANS.free.summariesPerDay,
      remaining: plan === "PRO"
        ? Math.max(0, PLANS.pro.summariesPerMonth - updatedUsed)
        : Math.max(0, PLANS.free.summariesPerDay - updatedUsed),
      isOverage: isNowOverage,
    },
  });
}
