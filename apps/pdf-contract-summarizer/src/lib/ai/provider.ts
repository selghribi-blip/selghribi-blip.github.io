export type SummaryMode = "general" | "contract";

export interface SummarizeOptions {
  /** Output language: "auto" detects from the PDF text. */
  language?: "auto" | "en" | "ar";
  /** Max number of bullet points in the summary. */
  maxBullets?: number;
  /** Summary mode: "general" or "contract" (Pro only). */
  mode?: SummaryMode;
}

/**
 * Common interface for all AI providers so the implementation can be swapped.
 */
export interface AiProvider {
  summarizeText(text: string, options?: SummarizeOptions): Promise<string>;
}
