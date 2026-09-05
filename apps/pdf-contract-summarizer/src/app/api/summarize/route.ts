// POST /api/summarize
// Accepts a PDF file, summarizes it with OpenAI, increments the user's
// monthly summary count, and reports overage usage to Stripe when applicable.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/stripe";
import OpenAI from "openai";
import pdfParse from "pdf-parse";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_FILE_BYTES_FREE = 10 * 1024 * 1024; // 10 MB
const MAX_FILE_BYTES_PRO = 50 * 1024 * 1024; // 50 MB

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true,
      summaryCount: true,
      summaryCountResetAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // ── Plan gate ────────────────────────────────────────────────────────────
  const isFree = user.plan !== "pro";
  const limit = isFree
    ? PLANS.free.includedSummaries
    : PLANS.pro.includedSummaries;

  // Reset monthly counter if a new UTC month has begun
  const now = new Date();
  const resetAt = new Date(user.summaryCountResetAt);
  const isNewMonth =
    now.getUTCFullYear() !== resetAt.getUTCFullYear() ||
    now.getUTCMonth() !== resetAt.getUTCMonth();

  let currentCount = isNewMonth ? 0 : user.summaryCount;

  if (isFree && currentCount >= limit) {
    return NextResponse.json(
      {
        error: "monthly_limit_reached",
        message: `Free plan includes ${limit} summaries/month. Upgrade to Pro for more.`,
      },
      { status: 402 }
    );
  }

  // ── Parse uploaded PDF ───────────────────────────────────────────────────
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { error: "No file uploaded" },
      { status: 400 }
    );
  }

  const maxBytes = isFree ? MAX_FILE_BYTES_FREE : MAX_FILE_BYTES_PRO;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File too large. Max ${maxBytes / 1024 / 1024} MB for your plan.` },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { text: pdfText } = await pdfParse(buffer);

  // ── Summarize with OpenAI ────────────────────────────────────────────────
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an expert legal and business document analyst. " +
          "Summarize the provided document concisely, highlighting: " +
          "key parties, main obligations, dates/deadlines, risks, and action items.",
      },
      { role: "user", content: pdfText.slice(0, 100_000) },
    ],
  });

  const summary = completion.choices[0]?.message?.content ?? "";

  // ── Increment count & reset if needed ────────────────────────────────────
  currentCount += 1;
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      summaryCount: currentCount,
      ...(isNewMonth ? { summaryCountResetAt: now } : {}),
    },
  });

  // ── Report overage to Stripe (Pro users beyond 200 included) ─────────────
  if (!isFree && currentCount > PLANS.pro.includedSummaries) {
    // Fire-and-forget: report usage asynchronously so it doesn't slow the response
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/usage`, {
      method: "POST",
      headers: { Cookie: request.headers.get("cookie") ?? "" },
    }).catch(() => {
      // Non-critical: log silently; Stripe usage record will be retried later
    });
  }

  return NextResponse.json({ summary });
}
