import OpenAI from "openai";
import type { AiProvider, SummarizeOptions } from "./provider";

export class OpenAiProvider implements AiProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async summarizeText(text: string, options?: SummarizeOptions): Promise<string> {
    const mode = options?.mode ?? "general";
    const maxBullets = options?.maxBullets ?? 8;

    const systemPrompt =
      mode === "contract"
        ? `You are a legal-contract analyst. Extract and summarize the key clauses, obligations, dates, parties, payment terms, and risk points from the provided contract text. Respond with ${maxBullets} concise bullet points. Detect the document language and respond in the same language unless it is ambiguous, then use English.`
        : `You are a helpful summarizer. Summarize the provided document into ${maxBullets} clear bullet points covering the main ideas. Detect the document language and respond in the same language unless it is ambiguous, then use English.`;

    const completion = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text.slice(0, 12000) }, // Limit input tokens
      ],
      max_tokens: 800,
      temperature: 0.3,
    });

    return completion.choices[0]?.message?.content ?? "(No summary generated)";
  }
}
