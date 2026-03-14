import { summarizeWithOpenAI } from './openai';
import { summarizeWithAnthropic } from './anthropic';

/**
 * Abstraction layer that selects the AI provider based on the AI_PROVIDER environment variable.
 * Defaults to OpenAI if the variable is not set or is unrecognised.
 *
 * @param text - The plain text to summarize.
 * @returns A promise resolving to the summary string.
 */
export async function summarizeText(text: string): Promise<string> {
  const provider = (process.env.AI_PROVIDER ?? 'openai').toLowerCase();

  if (provider === 'anthropic') {
    return summarizeWithAnthropic(text);
  }

  // Default: OpenAI
  return summarizeWithOpenAI(text);
}
