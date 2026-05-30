import { eq, desc, asc, inArray, lt, notInArray, and, SQL } from 'drizzle-orm';
import { db } from '../db/client';
import { conversations, messages } from '../db/schema';
import type { Conversation, Platform, Source } from '../domain/conversation';
import { getSettingJson } from './settings-store';
import { appendConversationEvent } from './event-log';

const DEFAULT_MAX_HISTORY = 40;

export async function getConversation(user_id: string): Promise<Conversation | null> {
  const [convo, { maxHistory }] = await Promise.all([
    db.query.conversations.findFirst({ where: eq(conversations.user_id, user_id) }),
    getSettingJson<{ maxHistory?: number }>('bot_settings', {}),
  ]);
  if (!convo) return null;

  const limit = maxHistory ?? DEFAULT_MAX_HISTORY;
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.user_id, user_id))
    .orderBy(desc(messages.created_at))
    .limit(limit);

  return {
    user_id: convo.user_id,
    first_name: convo.first_name,
    platform: convo.platform as Platform,
    source: convo.source as Source,
    started_from_comment: convo.started_from_comment,
    post_context: convo.post_context,
    status: convo.status,
    funnel_step: convo.funnel_step,
    paused: convo.paused,
    last_activity: convo.last_activity.getTime(),
    messages: msgs.reverse().map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
      timestamp: m.created_at.getTime(),
    })),
  };
}

export async function upsertConversation(params: {
  user_id: string;
  first_name: string | null;
  platform: Platform;
  source: Source;
  started_from_comment?: string | null;
  post_context?: string | null;
}): Promise<void> {
  await db
    .insert(conversations)
    .values({
      user_id: params.user_id,
      first_name: params.first_name,
      platform: params.platform,
      source: params.source,
      started_from_comment: params.started_from_comment ?? null,
      post_context: params.post_context ?? null,
      last_activity: new Date(),
    })
    .onConflictDoUpdate({
      target: conversations.user_id,
      set: {
        first_name: params.first_name,
        last_activity: new Date(),
        // post_context intentionally not overwritten — keep the original post that started the convo
      },
    });
}

export async function appendMessage(user_id: string, role: 'user' | 'assistant', content: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.insert(messages).values({ user_id, role, content });
    await tx.update(conversations).set({ last_activity: new Date() }).where(eq(conversations.user_id, user_id));
  });
}

const MAX_LOCK_RETRIES = 3;

export async function updateConversationStatus(
  user_id: string,
  status: string,
  funnel_step?: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dbClient: any = db,
): Promise<{ previousStatus: string; currentStatus: string }> {
  let previousStatus = status;

  for (let attempt = 0; attempt <= MAX_LOCK_RETRIES; attempt++) {
    const [row] = await dbClient
      .select({ status: conversations.status, version: conversations.version })
      .from(conversations)
      .where(eq(conversations.user_id, user_id))
      .limit(1);

    if (!row) break; // conversation was deleted — nothing to update

    previousStatus = row.status;
    if (previousStatus === status && row.version > 0) {
      // Already at the target status — nothing to do
      return { previousStatus, currentStatus: status };
    }

    const updated = await dbClient
      .update(conversations)
      .set({
        status,
        version: row.version + 1,
        ...(funnel_step !== undefined ? { funnel_step } : {}),
      })
      .where(and(eq(conversations.user_id, user_id), eq(conversations.version, row.version)))
      .returning({ updatedVersion: conversations.version });

    if (updated.length > 0) {
      // Write succeeded — append to the event log (best-effort, non-blocking)
      void appendConversationEvent(user_id, 'status_changed', {
        from: previousStatus,
        to: status,
        funnel_step,
        version: updated[0].updatedVersion,
      });
      return { previousStatus, currentStatus: status };
    }
    // Another writer updated the row between our SELECT and UPDATE — retry
  }

  // Exhausted retries — return best-effort (status read on last attempt)
  return { previousStatus, currentStatus: status };
}

export async function markExpiredConversations(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dbClient: any = db,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settingsReader: (key: string, defaults: any) => Promise<any> = getSettingJson,
): Promise<void> {
  const { ttl } = await settingsReader('bot_settings', {});
  const ttlMs = (ttl ?? 23) * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - ttlMs);
  await dbClient
    .update(conversations)
    .set({ status: 'Archived' })
    .where(
      and(
        notInArray(conversations.status, ['Booked', 'Archived']),
        lt(conversations.last_activity, cutoff),
      ),
    );
}

export async function setConversationPaused(
  user_id: string,
  paused: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dbClient: any = db,
): Promise<void> {
  await dbClient.update(conversations).set({ paused }).where(eq(conversations.user_id, user_id));
  void appendConversationEvent(user_id, paused ? 'paused' : 'resumed');
}

export async function deleteConversation(user_id: string): Promise<void> {
  await db.delete(conversations).where(eq(conversations.user_id, user_id));
}

export async function deleteAllConversations(): Promise<void> {
  await db.delete(conversations);
}

export interface ApiConversationResponse {
  user_id: string;
  first_name: string | null;
  platform: string;
  source: string;
  startedFromComment: string | null;
  status: string;
  funnelStep: number;
  paused: boolean;
  lastActivity: number;
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>;
}

export async function getAllConversations(opts: { limit?: number; cursor?: number } = {}): Promise<ApiConversationResponse[]> {
  const limit = Math.min(opts.limit ?? 50, 200);
  const conditions: SQL[] = [];
  if (opts.cursor) conditions.push(lt(conversations.last_activity, new Date(opts.cursor)));

  const convos = await db
    .select()
    .from(conversations)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(conversations.last_activity))
    .limit(limit);
  if (convos.length === 0) return [];

  const userIds = convos.map((c) => c.user_id);
  const allMessages = await db
    .select()
    .from(messages)
    .where(inArray(messages.user_id, userIds))
    .orderBy(asc(messages.created_at));

  const msgsByUser = new Map<string, typeof allMessages>();
  for (const msg of allMessages) {
    const bucket = msgsByUser.get(msg.user_id) ?? [];
    bucket.push(msg);
    msgsByUser.set(msg.user_id, bucket);
  }

  return convos.map((convo) => ({
    user_id: convo.user_id,
    first_name: convo.first_name,
    platform: convo.platform,
    source: convo.source,
    startedFromComment: convo.started_from_comment,
    status: convo.status,
    funnelStep: convo.funnel_step,
    paused: convo.paused,
    lastActivity: convo.last_activity.getTime(),
    messages: (msgsByUser.get(convo.user_id) ?? []).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
      timestamp: m.created_at.getTime(),
    })),
  }));
}
