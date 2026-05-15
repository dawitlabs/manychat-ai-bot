import OpenAI from 'openai';
import { env } from '../config/env';
import { getSettingJson } from './settings-store';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

interface BotSettings {
  model: string;
  maxTokens: number;
  temperature: number;
}

const SETTING_DEFAULTS: BotSettings = { model: 'gpt-4o-mini', maxTokens: 300, temperature: 0.7 };

export async function generateReply(
  systemPrompt: string,
  messageHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  options: { maxTokens?: number; temperature?: number } = {},
): Promise<string> {
  const botSettings = await getSettingJson<BotSettings>('bot_settings', SETTING_DEFAULTS);

  const completion = await openai.chat.completions.create({
    model: botSettings.model ?? 'gpt-4o-mini',
    messages: [{ role: 'system', content: systemPrompt }, ...messageHistory],
    max_tokens: options.maxTokens ?? botSettings.maxTokens ?? 300,
    temperature: options.temperature ?? botSettings.temperature ?? 0.7,
  });
  return completion.choices[0].message.content?.trim() ?? '';
}
