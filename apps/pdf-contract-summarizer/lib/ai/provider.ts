export type SummarizeOptions = {
  language?: "auto" | "en" | "ar";
  maxBullets?: number;
  mode?: "general" | "contract";
};

export interface AiProvider {
  summarizeText(text: string, options?: SummarizeOptions): Promise<string>;
}
