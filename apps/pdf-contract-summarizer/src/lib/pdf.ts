import pdf from "pdf-parse";

// Maximum PDF sizes per plan (in bytes).
export const FREE_MAX_PDF_BYTES = 5 * 1024 * 1024;   // 5 MB for free users
export const PRO_MAX_PDF_BYTES  = 25 * 1024 * 1024;  // 25 MB for pro users

/**
 * Extracts plain text from a PDF buffer.
 * Removes excessive whitespace so the AI gets a clean input.
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const result = await pdf(buffer);
  return (result.text || "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
