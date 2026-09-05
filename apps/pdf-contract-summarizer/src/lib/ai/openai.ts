/**
 * lib/ai/openai.ts
 * OpenAI-backed summarisation provider.
 */
import OpenAI from "openai";
import { AiProvider, SummarizeOptions } from "./provider";

const SYSTEM_GENERAL = `You are a professional document summariser. 
Summarise the provided text clearly and concisely:
- Start with a one-sentence overview.
- Follow with key bullet points (up to {maxBullets}).
- Use the same language as the document unless instructed otherwise.
- Output Markdown.`;

const SYSTEM_CONTRACT = `You are a senior legal analyst specialising in contract review.
Analyse the provided contract text and output Markdown with these sections:
1. **Overview** – one paragraph describing what the contract is.
2. **Key Parties** – list the parties involved.
3. **Key Obligations** – what each party must do.
4. **Important Dates & Deadlines** – any dates or timeframes.
5. **Payment Terms** – amounts, schedules, and penalties if present.
6. **Risk Flags** – clauses that warrant attention (auto-renewal, limitation of liability, etc.).
7. **Summary** – brief overall assessment.
Use the same language as the contract unless instructed otherwise.`;

export class OpenAiProvider implements AiProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async summarizeText(text: string, options: SummarizeOptions = {}): Promise<string> {
    const { mode = "general", maxBullets = 8 } = options;
    const systemPrompt = (
      mode === "contract" ? SYSTEM_CONTRACT : SYSTEM_GENERAL
    ).replace("{maxBullets}", String(maxBullets));

    // Truncate text to avoid token-limit errors (keep ~12,000 chars ≈ ~3k tokens)
    const truncated = text.length > 12_000 ? text.slice(0, 12_000) + "\n…[truncated]" : text;

    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: truncated },
      ],
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content ?? "(No summary returned)";
  }
}
