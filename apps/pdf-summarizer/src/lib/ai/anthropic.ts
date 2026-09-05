import Anthropic from '@anthropic-ai/sdk';

// Singleton Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? '',
});

/**
 * Summarizes the provided text using Anthropic claude-3-haiku-20240307.
 * Returns the model's summary string.
 */
export async function summarizeWithAnthropic(text: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1000,
    system:
      'You are a document summarizer. Create a concise summary that captures the key points and main ideas of the provided text.',
    messages: [
      {
        role: 'user',
        content: `Please summarize the following text:\n\n${text}`,
      },
    ],
  });

  // Extract text from the first content block
  const firstBlock = response.content[0];
  if (firstBlock?.type === 'text') {
    return firstBlock.text;
  }
  return 'Summary could not be generated.';
}
