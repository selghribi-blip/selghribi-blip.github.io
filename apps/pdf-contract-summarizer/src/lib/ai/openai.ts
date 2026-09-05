import type { AiProvider, SummarizeOptions } from "./provider";

/**
 * OpenAI-based implementation of AiProvider.
 * Uses the chat completions endpoint with gpt-4o-mini for cost efficiency.
 */
export class OpenAiProvider implements AiProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model = "gpt-4o-mini") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async summarizeText(text: string, options: SummarizeOptions = {}): Promise<string> {
    const { language = "auto", maxBullets = 8, mode = "general" } = options;

    // Truncate very long texts to avoid token limits.
    const maxChars = 15_000;
    const truncated = text.length > maxChars ? text.slice(0, maxChars) + "\n…[truncated]" : text;

    const systemPrompt =
      mode === "contract"
        ? buildContractSystemPrompt(language, maxBullets)
        : buildGeneralSystemPrompt(language, maxBullets);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: truncated },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${errBody}`);
    }

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
    };

    return data.choices[0]?.message?.content?.trim() ?? "(no summary generated)";
  }
}

// ── System prompt builders ────────────────────────────────────────────────────

function buildGeneralSystemPrompt(language: string, maxBullets: number): string {
  const lang =
    language === "ar"
      ? "Arabic"
      : language === "en"
        ? "English"
        : "the same language as the document";

  return [
    `You are an expert document summarizer. Respond in ${lang}.`,
    `Summarize the following PDF text into:`,
    `1. A one-paragraph executive summary (3–4 sentences).`,
    `2. Up to ${maxBullets} key bullet points.`,
    `Be concise, factual, and avoid repetition.`,
  ].join("\n");
}

function buildContractSystemPrompt(language: string, maxBullets: number): string {
  const lang =
    language === "ar"
      ? "Arabic"
      : language === "en"
        ? "English"
        : "the same language as the document";

  return [
    `You are a legal contract analyst. Respond in ${lang}.`,
    `Analyze the following contract and provide:`,
    `1. A one-paragraph executive summary.`,
    `2. Up to ${maxBullets} key clauses and obligations.`,
    `3. Up to 3 potential risks or important dates to watch.`,
    `Format your response using Markdown. Be precise and professional.`,
  ].join("\n");
}
