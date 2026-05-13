import OpenAI from 'openai';
import { env } from '../config/env';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function generateReply(
  systemPrompt: string,
  messageHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  options: { maxTokens?: number; temperature?: number } = {},
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: systemPrompt }, ...messageHistory],
    max_tokens: options.maxTokens ?? 300,
    temperature: options.temperature ?? 0.7,
  });
  return completion.choices[0].message.content?.trim() ?? '';
}
