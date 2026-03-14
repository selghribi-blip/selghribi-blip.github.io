// Maximum allowed PDF file size: 10 MB
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Extracts plain text from a PDF buffer using pdf-parse.
 * Throws an error if the buffer exceeds MAX_FILE_SIZE_BYTES.
 *
 * pdf-parse does not support ESM; use require() with a type cast.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File too large. Maximum allowed size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.`
    );
  }

  // pdf-parse doesn't support ESM well; use require with a type cast
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (
    buffer: Buffer
  ) => Promise<{ text: string }>;

  const data = await pdfParse(buffer);
  return data.text;
}
