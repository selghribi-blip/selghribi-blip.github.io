import { summarizeWithOpenAI } from "./openai";

export type SummaryMode = "pdf" | "contract";

export interface SummaryResult {
  summary: string;
}

export async function summarize(
  text: string,
  mode: SummaryMode
): Promise<SummaryResult> {
  return summarizeWithOpenAI(text, mode);
}
