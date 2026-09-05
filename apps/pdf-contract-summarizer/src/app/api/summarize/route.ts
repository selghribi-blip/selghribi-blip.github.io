import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractTextFromPDF } from "@/lib/pdf";
import { summarize, SummaryMode } from "@/lib/ai";
import { getLimits } from "@/lib/limits";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const limits = getLimits(user.plan);

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const mode = (formData.get("mode") as SummaryMode) ?? "pdf";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
  }

  if (file.size > limits.maxPdfBytes) {
    const maxMb = limits.maxPdfBytes / (1024 * 1024);
    return NextResponse.json(
      { error: `File too large. Your plan allows up to ${maxMb} MB.` },
      { status: 413 }
    );
  }

  if (mode === "contract" && !limits.contractMode) {
    return NextResponse.json(
      { error: "Contract mode requires a Pro plan. Please upgrade." },
      { status: 403 }
    );
  }

  if (limits.dailySummaries !== Infinity) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCount = await prisma.summary.count({
      where: {
        userId,
        createdAt: { gte: todayStart },
      },
    });

    if (todayCount >= limits.dailySummaries) {
      return NextResponse.json(
        { error: `Daily limit reached (${limits.dailySummaries} summaries/day on free plan). Upgrade to Pro for unlimited.` },
        { status: 429 }
      );
    }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractTextFromPDF(buffer);

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: "Could not extract text from the PDF. The file may be scanned or image-only." },
        { status: 422 }
      );
    }

    const result = await summarize(text, mode);

    const saved = await prisma.summary.create({
      data: {
        userId,
        filename: file.name,
        mode,
        outputText: result.summary,
      },
    });

    return NextResponse.json({
      id: saved.id,
      summary: result.summary,
      extractedPreview: text.slice(0, 500),
      filename: file.name,
      mode,
    });
  } catch (err) {
    console.error("Summarize error:", err);
    return NextResponse.json(
      { error: "Failed to process the PDF. Please try again." },
      { status: 500 }
    );
  }
}
