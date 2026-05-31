import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { conversationEvents, conversations } from '../db/schema';
import { Sentry } from '../config/sentry';
import { log } from '../lib/logger';

export type ConversationEventType =
  | 'status_changed'
  | 'booked'
  | 'paused'
  | 'resumed';

export interface RecentEvent {
  id: number;
  user_id: string;
  first_name: string | null;
  type: ConversationEventType;
  payload: Record<string, unknown> | null;
  created_at: string; // ISO
}

export async function getRecentEvents(opts: { limit?: number } = {}): Promise<RecentEvent[]> {
  const limit = Math.min(opts.limit ?? 50, 200);
  const rows = await db
    .select({
      id: conversationEvents.id,
      user_id: conversationEvents.user_id,
      first_name: conversations.first_name,
      type: conversationEvents.type,
      payload: conversationEvents.payload,
      created_at: conversationEvents.created_at,
    })
    .from(conversationEvents)
    .leftJoin(conversations, eq(conversationEvents.user_id, conversations.user_id))
    .orderBy(desc(conversationEvents.created_at))
    .limit(limit);

  return rows.map((r) => ({
    id: Number(r.id),
    user_id: r.user_id,
    first_name: r.first_name ?? null,
    type: r.type as ConversationEventType,
    payload: (r.payload as Record<string, unknown> | null) ?? null,
    created_at: r.created_at.toISOString(),
  }));
}

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
