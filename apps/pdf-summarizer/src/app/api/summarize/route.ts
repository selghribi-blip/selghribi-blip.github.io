import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { summarizeText } from '@/lib/ai';
import prisma from '@/lib/prisma';
import { SubscriptionStatus } from '@/types';

/**
 * POST /api/summarize
 * Accepts { text: string, filename: string } in the request body.
 * Checks that the authenticated user has an ACTIVE subscription,
 * calls the AI provider to generate a summary, persists it, and returns it.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // Ensure the user is authenticated
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the user has an active subscription
  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: { status: true },
  });

  if (subscription?.status !== SubscriptionStatus.ACTIVE) {
    return NextResponse.json(
      { error: 'Subscription required', upgradeUrl: '/pricing' },
      { status: 402 }
    );
  }

  // Parse request body
  let body: { text?: string; filename?: string };
  try {
    body = (await req.json()) as { text?: string; filename?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { text, filename = 'document.pdf' } = body;
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }

  // Generate the AI summary
  let summary: string;
  try {
    summary = await summarizeText(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI summarization failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Persist the summary to the database (store first 500 chars of extracted text)
  await prisma.summary.create({
    data: {
      userId: session.user.id,
      filename,
      extractedText: text.slice(0, 500),
      summary,
    },
  });

  return NextResponse.json({ summary });
}
