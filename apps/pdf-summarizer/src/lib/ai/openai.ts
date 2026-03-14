import OpenAI from 'openai';

// Singleton OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? '',
});

/**
 * Summarizes the provided text using OpenAI gpt-4o-mini.
 * Returns the model's summary string.
 */
export async function summarizeWithOpenAI(text: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1000,
    messages: [
      {
        role: 'system',
        content:
          'You are a document summarizer. Create a concise summary that captures the key points and main ideas of the provided text.',
      },
      {
        role: 'user',
        content: `Please summarize the following text:\n\n${text}`,
      },
    ],
  });

  return response.choices[0]?.message?.content ?? 'Summary could not be generated.';
}
