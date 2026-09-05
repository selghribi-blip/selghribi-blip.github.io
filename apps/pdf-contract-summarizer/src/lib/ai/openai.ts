import OpenAI from "openai";
import type { SummaryMode, SummaryResult } from "./index";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PROMPTS: Record<SummaryMode, string> = {
  pdf: `You are a document summarizer. Read the provided text and write a clear, concise summary.
Focus on the main topics, key points, and conclusions.
Format the response in clear paragraphs.`,

  contract: `You are a contract analysis expert. Analyze the provided contract text and extract:
1. **Key Clauses**: The most important contract terms and conditions
2. **Obligations**: What each party must do
3. **Important Dates**: Deadlines, effective dates, renewal dates
4. **Risks**: Potential risks or unfavorable terms
5. **Summary**: A brief overall summary

Use clear headings and bullet points for each section.`,
};

export async function summarizeWithOpenAI(
  text: string,
  mode: SummaryMode
): Promise<SummaryResult> {
  const truncated = text.slice(0, 12000);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: PROMPTS[mode] },
      { role: "user", content: truncated },
    ],
    temperature: 0.3,
  });

  const summary = completion.choices[0]?.message?.content ?? "No summary generated.";
  return { summary };
}
