/**
 * lib/ai/provider.ts
 * Abstract interface for AI summarisation providers.
 * Swap out the concrete implementation without touching the API route.
 */

export type SummaryMode = "general" | "contract";

export interface SummarizeOptions {
  mode?: SummaryMode;
  language?: "auto" | "en" | "ar";
  maxBullets?: number;
}

export interface AiProvider {
  summarizeText(text: string, options?: SummarizeOptions): Promise<string>;
}
