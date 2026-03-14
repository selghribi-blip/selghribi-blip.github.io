export type SummaryMode = "general" | "contract";

export type SummarizeOptions = {
  mode?: SummaryMode;
  language?: "auto" | "en" | "ar";
  maxBullets?: number;
};

export interface AiProvider {
  summarizeText(text: string, options?: SummarizeOptions): Promise<string>;
}
