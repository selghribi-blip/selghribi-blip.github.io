import { PDFParse } from "pdf-parse";

/**
 * Extract plain text from a PDF buffer using pdf-parse v2.
 * Cleans up excessive whitespace before returning.
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return (result.text ?? "").replace(/\s+\n/g, "\n").trim();
}
