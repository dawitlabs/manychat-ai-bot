import { db } from '../db/client';
import { conversationEvents } from '../db/schema';
import { Sentry } from '../config/sentry';
import { log } from '../lib/logger';

export type ConversationEventType =
  | 'status_changed'
  | 'booked'
  | 'paused'
  | 'resumed';

/**
 * Append an immutable event to the conversation event log.
 * Fire-and-forget safe — errors are captured to Sentry and logged, never thrown.
 */
export async function appendConversationEvent(
  user_id: string,
  type: ConversationEventType,
  payload?: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(conversationEvents).values({ user_id, type, payload: payload ?? null });
  } catch (err) {
    log.error('[event-log] failed to append event', { user_id, type, message: (err as Error).message });
    Sentry.captureException(err, { extra: { user_id, type } });
  }
}
