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

export interface Classification {
  funnelStep: 1 | 2 | 3 | 4 | 5 | 6;
  status: 'New' | 'Engaged' | 'Qualified' | 'Booked';
}

const CLASSIFY_SYSTEM = `You classify sales conversations for a fitness coaching bot.
Given the conversation history, return ONLY valid JSON with two fields:
- funnelStep: integer 1-6 (1=goal, 2=nutrition, 3=struggle, 4=offered help, 5=pivoting to call, 6=booking link sent)
- status: one of "New" (step 1), "Engaged" (steps 2-3), "Qualified" (step 4), "Booked" (steps 5-6 or if a Calendly link appears)
No markdown, no explanation. Example: {"funnelStep":3,"status":"Engaged"}`;

export async function classifyConversation(
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<Classification> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: CLASSIFY_SYSTEM }, ...history],
      max_tokens: 40,
      temperature: 0,
    });
    const raw = completion.choices[0].message.content?.trim() ?? '{}';
    const parsed = JSON.parse(raw) as { funnelStep?: number; status?: string };
    const funnelStep = (Math.min(6, Math.max(1, parsed.funnelStep ?? 1))) as Classification['funnelStep'];
    const validStatuses = new Set(['New', 'Engaged', 'Qualified', 'Booked']);
    const status = validStatuses.has(parsed.status ?? '') ? (parsed.status as Classification['status']) : 'New';
    return { funnelStep, status };
  } catch {
    return { funnelStep: 1, status: 'New' };
  }
}

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
