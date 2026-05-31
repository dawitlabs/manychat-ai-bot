import { env } from '../config/env';
import { fetchWithRetry } from '../lib/http';
import { log } from '../lib/logger';

const MC_OPTS = { timeoutMs: 8_000, maxRetries: 2, target: 'manychat' };

/**
 * Push a text reply to a ManyChat subscriber.
 *
 * Strategy:
 *   1. sendContent  — works for Facebook subscribers with an active messaging window.
 *   2. setCustomFieldByName('ai_response') + sendFlow — Instagram fallback via a
 *      ManyChat automation flow that reads the custom field and sends it.
 *
 * Returns true if the message was delivered, false if MANYCHAT_API_KEY is unset or
 * delivery failed after retries.
 */
export async function sendToManychat(userId: string, text: string): Promise<boolean> {
  if (!env.MANYCHAT_API_KEY) return false;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${env.MANYCHAT_API_KEY}`,
  };

  try {
    // 1. Try sendContent (works for Facebook subscribers with active window)
    const mcRes = await fetchWithRetry(
      'https://api.manychat.com/fb/sending/sendContent',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          subscriber_id: userId,
          data: { version: 'v2', content: { messages: [{ type: 'text', text }] } },
        }),
      },
      MC_OPTS,
    );

    if (mcRes.ok) return true;

    // 2. sendContent failed — fall back to custom field + Instagram flow
    const fieldRes = await fetchWithRetry(
      'https://api.manychat.com/fb/subscriber/setCustomFieldByName',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ subscriber_id: userId, field_name: 'ai_response', field_value: text }),
      },
      MC_OPTS,
    );

    if (!fieldRes.ok) {
      const body = await fieldRes.text().catch(() => '');
      log.warn('ManyChat setCustomField failed', { userId, status: fieldRes.status, body });
      return false;
    }

    if (!env.MANYCHAT_IG_FLOW_NS) {
      log.warn('ManyChat sendFlow skipped — MANYCHAT_IG_FLOW_NS not set', { userId });
      return false;
    }

    const flowRes = await fetchWithRetry(
      'https://api.manychat.com/fb/sending/sendFlow',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ subscriber_id: userId, flow_ns: env.MANYCHAT_IG_FLOW_NS }),
      },
      MC_OPTS,
    );

    if (!flowRes.ok) {
      const body = await flowRes.text().catch(() => '');
      log.warn('ManyChat sendFlow failed', { userId, status: flowRes.status, body });
      return false;
    }

    return true;
  } catch (err) {
    const isTimeout = (err as Error).name === 'AbortError';
    log.warn('ManyChat send error', { userId, msg: (err as Error).message, timeout: isTimeout });
    return false;
  }
}
