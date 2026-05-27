import OpenAI from 'openai';
import { env } from '../config/env';
import { getSettingJson } from './settings-store';
import { db } from '../db/client';
import { openaiUsage } from '../db/schema';
import { computeCostUsd } from './openai-pricing';
import { Sentry } from '../config/sentry';
import { log } from '../lib/logger';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY, timeout: 30_000 });

interface BotSettings {
  model: string;
  maxTokens: number;
  temperature: number;
}

const SETTING_DEFAULTS: BotSettings = { model: 'gpt-4o-mini', maxTokens: 220, temperature: 0.4 };

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1_000;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function isRetryable(err: unknown): boolean {
  if (err instanceof OpenAI.RateLimitError) return true;
  if (err instanceof OpenAI.InternalServerError) return true;
  if (err instanceof OpenAI.APIConnectionError) return true;
  if (err instanceof OpenAI.APIConnectionTimeoutError) return true;
  if (err instanceof OpenAI.APIError && [502, 503, 504].includes(err.status)) return true;
  return false;
}

function retryDelay(err: unknown, attempt: number): number {
  // Respect retry-after header on 429s
  if (err instanceof OpenAI.RateLimitError) {
    const header = (err.headers as Record<string, string> | undefined)?.['retry-after'];
    if (header) return parseInt(header, 10) * 1_000;
  }
  // Exponential backoff with jitter, capped at 10s
  const base = BASE_DELAY_MS * Math.pow(2, attempt);
  return Math.min(base + Math.random() * 500, 10_000);
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || attempt === MAX_RETRIES) throw err;
      const delay = retryDelay(err, attempt);
      log.warn('[openai] request failed, retrying', { attempt: attempt + 1, delayMs: Math.round(delay) });
      await sleep(delay);
    }
  }
  throw lastErr;
}

export interface Classification {
  funnelStep: 1 | 2 | 3 | 4 | 5 | 6;
  status: 'New' | 'Engaged' | 'Qualified' | 'Booked';
}

const CLASSIFY_SYSTEM = `You classify sales conversations for a fitness coaching bot.
Given the conversation history, return ONLY valid JSON with two fields:
- funnelStep: integer 1-6 (1=goal, 2=nutrition, 3=struggle, 4=offered help, 5=pivoting to call, 6=booking link sent)
- status: one of "New" (step 1), "Engaged" (steps 2-3), "Qualified" (step 4), "Booked" (steps 5-6 or if a Calendly link appears)
No markdown, no explanation. Example: {"funnelStep":3,"status":"Engaged"}`;

async function logUsage(model: string, usage: OpenAI.CompletionUsage | undefined, userId?: string): Promise<void> {
  if (!usage) return;
  const { prompt_tokens, completion_tokens } = usage;
  const cost = computeCostUsd(model, prompt_tokens, completion_tokens);
  log.info('[openai] usage', { model, promptTokens: prompt_tokens, completionTokens: completion_tokens, costUsd: cost.toFixed(6) });
  try {
    await db.insert(openaiUsage).values({ model, prompt_tokens, completion_tokens, user_id: userId ?? null });
  } catch (err) {
    log.warn('[openai] failed to log usage', { message: (err as Error).message });
    Sentry.captureMessage('OpenAI usage log insert failed', { level: 'warning', extra: { error: (err as Error).message } });
  }
}

type Completions = Pick<OpenAI['chat']['completions'], 'create'>;

export async function classifyConversation(
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  completions: Completions = openai.chat.completions,
): Promise<Classification | null> {
  const model = 'gpt-4o-mini';
  try {
    const completion = await withRetry(() =>
      completions.create({
        model,
        messages: [{ role: 'system', content: CLASSIFY_SYSTEM }, ...history],
        max_tokens: 40,
        temperature: 0,
      }),
    );
    void logUsage(model, completion.usage ?? undefined);
    const raw = completion.choices[0].message.content?.trim() ?? '{}';
    const parsed = JSON.parse(raw) as { funnelStep?: number; status?: string };
    const funnelStep = (Math.min(6, Math.max(1, parsed.funnelStep ?? 1))) as Classification['funnelStep'];
    const validStatuses = new Set(['New', 'Engaged', 'Qualified', 'Booked']);
    const status = validStatuses.has(parsed.status ?? '') ? (parsed.status as Classification['status']) : 'New';
    return { funnelStep, status };
  } catch (err) {
    Sentry.captureException(err);
    return null;
  }
}

export async function generateReply(
  systemPrompt: string,
  messageHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  options: { maxTokens?: number; temperature?: number; userId?: string } = {},
): Promise<string> {
  const botSettings = await getSettingJson<BotSettings>('bot_settings', SETTING_DEFAULTS);
  const model = botSettings.model ?? 'gpt-4o-mini';

  const completion = await withRetry(() =>
    openai.chat.completions.create({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...messageHistory],
      max_tokens: options.maxTokens ?? botSettings.maxTokens ?? 300,
      temperature: options.temperature ?? botSettings.temperature ?? 0.7,
    }),
  );
  void logUsage(model, completion.usage ?? undefined, options.userId);
  return completion.choices[0].message.content?.trim() ?? '';
}
