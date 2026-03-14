import pdfParse from "pdf-parse";

export const FREE_PDF_MAX_BYTES = 5 * 1024 * 1024;
export const PRO_PDF_MAX_BYTES  = 20 * 1024 * 1024;

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}
