import pdf from "pdf-parse";

/**
 * Extract plain text from a PDF buffer.
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const result = await pdf(buffer);
  return (result.text || "").replace(/\s+\n/g, "\n").trim();
}
