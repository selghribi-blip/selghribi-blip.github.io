/**
 * lib/pdf.ts
 * Server-side PDF text extraction using pdf-parse.
 */
import pdf from "pdf-parse";

/**
 * Extracts plain text from a PDF Buffer.
 * Normalises excessive whitespace while preserving line breaks.
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const result = await pdf(buffer);
  // Collapse runs of spaces/tabs but keep single newlines for readability
  return (result.text ?? "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
