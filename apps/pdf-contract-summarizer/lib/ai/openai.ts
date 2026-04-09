import { AiProvider, SummarizeOptions } from "./provider";

/**
 * OpenAI implementation using the chat completions endpoint.
 * Supports general PDF summarization and contract analysis modes.
 */
export class OpenAiProvider implements AiProvider {
  constructor(private apiKey: string) {}

  async summarizeText(text: string, options?: SummarizeOptions): Promise<string> {
    const language = options?.language ?? "auto";
    const maxBullets = options?.maxBullets ?? 8;
    const mode = options?.mode ?? "general";

    const systemPrompt =
      mode === "contract"
        ? `You are a legal contract analyst. Extract and summarize: key parties, obligations, payment terms, termination clauses, risks, and important dates. Use concise bullet points. Respond in the same language as the document${language !== "auto" ? ` (force: ${language})` : ""}.`
        : `You are a helpful document summarizer. Provide a clear summary with up to ${maxBullets} key bullet points. Respond in the same language as the document${language !== "auto" ? ` (force: ${language})` : ""}.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Document text:\n\n${text.slice(0, 12000)}`,
          },
        ],
        max_tokens: 1024,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error: ${err}`);
    }

    const data = await response.json() as {
      choices: { message: { content: string } }[];
    };
    return data.choices[0]?.message?.content ?? "No summary returned.";
  }
}
