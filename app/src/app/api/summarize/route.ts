import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUserPlan, PLANS } from '@/lib/subscription';
import { checkRateLimit, incrementUsage } from '@/lib/rateLimit';
import OpenAI from 'openai';
import pdf from 'pdf-parse/lib/pdf-parse.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id ?? session.user.email;
  const planName = await getUserPlan();
  const plan = PLANS[planName];

  // Check rate limit for free users
  if (planName === 'FREE') {
    const { allowed, used, limit, resetAt } = checkRateLimit(userId, plan.dailyLimit);
    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Daily limit reached',
          used,
          limit,
          resetAt,
          upgradeUrl: '/pricing',
        },
        { status: 429 }
      );
    }
  }

  // Parse multipart form data
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const mode = (formData.get('mode') as string | null) ?? 'standard';

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate file type
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
  }

  // Validate file size (10 MB limit)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum size is 10 MB.' }, { status: 413 });
  }

  // Contract mode is gated for Pro users
  if (mode === 'contract' && !plan.contractMode) {
    return NextResponse.json(
      {
        error: 'Contract mode is available on the Pro plan only',
        upgradeUrl: '/pricing',
      },
      { status: 403 }
    );
  }

  // Extract text from PDF
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let text: string;
  try {
    const parsed = await pdf(buffer);
    text = parsed.text;
  } catch {
    return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 422 });
  }

  if (!text.trim()) {
    return NextResponse.json(
      { error: 'No extractable text found in the PDF (scanned image PDFs are not yet supported)' },
      { status: 422 }
    );
  }

  // Truncate to avoid exceeding model context window
  const MAX_CHARS = 15000;
  const truncated = text.length > MAX_CHARS;
  const inputText = truncated ? text.slice(0, MAX_CHARS) : text;

  const systemPrompt =
    mode === 'contract'
      ? `You are a legal contract analyst. Extract and summarise the following from the contract:
1. Parties involved
2. Key obligations for each party
3. Payment terms and amounts
4. Duration and termination clauses
5. Liability and indemnification
6. Any unusual or high-risk clauses to flag

Present each section clearly with a heading.`
      : `You are a document summariser. Provide a clear, concise summary of the following document in 3–5 paragraphs. Highlight the main points, key findings, and any important conclusions.`;

  let summary: string;
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `${truncated ? '[Note: document truncated to first 15,000 characters]\n\n' : ''}${inputText}`,
        },
      ],
      max_tokens: 1024,
      temperature: 0.3,
    });
    summary = completion.choices[0]?.message?.content ?? '';
  } catch {
    return NextResponse.json({ error: 'Summarisation failed. Please try again.' }, { status: 502 });
  }

  // Increment usage only after a successful summary
  if (planName === 'FREE') {
    incrementUsage(userId);
  }

  const { used: usedAfter, limit } = checkRateLimit(userId, plan.dailyLimit);
  return NextResponse.json({
    summary,
    truncated,
    plan: planName,
    usage: planName === 'FREE' ? { used: usedAfter, limit } : null,
  });
}
