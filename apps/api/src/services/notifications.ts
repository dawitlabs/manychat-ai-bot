import { env } from '../config/env';
import { Sentry } from '../config/sentry';
import { log } from '../lib/logger';

export async function notifyBooking(lead: {
  user_id: string;
  first_name: string | null;
  platform: string;
}): Promise<void> {
  if (!env.SLACK_WEBHOOK_URL) return;

  const name = lead.first_name ?? lead.user_id;
  const text = `:tada: New booking — *${name}* (${lead.platform}) just got the Calendly link.`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);

  try {
    const res = await fetch(env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    if (!res.ok) {
      Sentry.captureMessage('Slack webhook returned non-2xx', { extra: { status: res.status } });
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      Sentry.captureMessage('Slack webhook timed out after 5s');
    } else {
      log.error('Slack notify failed', { message: (err as Error).message });
      Sentry.captureException(err);
    }
  } finally {
    clearTimeout(timer);
  }
}
