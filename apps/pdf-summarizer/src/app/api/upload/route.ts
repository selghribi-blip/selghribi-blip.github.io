import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { extractTextFromPdf } from '@/lib/pdf';

// Maximum characters returned to the client for preview purposes
const PREVIEW_CHAR_LIMIT = 500;

/**
 * POST /api/upload
 * Accepts a multipart/form-data request with a "file" field containing a PDF.
 * Returns the extracted text (or a truncated preview) along with metadata.
 * Requires an authenticated session.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // Ensure the user is authenticated
  const session = await getServerAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse multipart form data using the native Next.js App Router API
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Read the file into a buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Extract text from the PDF
  let extractedText: string;
  try {
    extractedText = await extractTextFromPdf(buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to extract text';
    return NextResponse.json({ error: message }, { status: 422 });
  }

  const charCount = extractedText.length;
  const truncated = charCount > PREVIEW_CHAR_LIMIT;

  return NextResponse.json({
    // Return full text for summarization but flag truncation for UI preview
    text: extractedText,
    charCount,
    truncated,
  });
}
