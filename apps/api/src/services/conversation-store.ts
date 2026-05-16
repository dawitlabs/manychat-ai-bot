import { eq, desc, asc, inArray } from 'drizzle-orm';
import { db } from '../db/client';
import { conversations, messages } from '../db/schema';
import type { Conversation, Platform, Source } from '../domain/conversation';
import { getSettingJson } from './settings-store';

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
    status: convo.status,
    funnel_step: convo.funnel_step,
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
}): Promise<void> {
  await db
    .insert(conversations)
    .values({
      user_id: params.user_id,
      first_name: params.first_name,
      platform: params.platform,
      source: params.source,
      started_from_comment: params.started_from_comment ?? null,
      last_activity: new Date(),
    })
    .onConflictDoUpdate({
      target: conversations.user_id,
      set: {
        first_name: params.first_name,
        last_activity: new Date(),
      },
    });
}

export async function appendMessage(user_id: string, role: 'user' | 'assistant', content: string): Promise<void> {
  await db.insert(messages).values({ user_id, role, content });
  await db
    .update(conversations)
    .set({ last_activity: new Date() })
    .where(eq(conversations.user_id, user_id));
}

export async function updateConversationStatus(user_id: string, status: string, funnel_step?: number): Promise<void> {
  await db
    .update(conversations)
    .set({ status, ...(funnel_step !== undefined ? { funnel_step } : {}) })
    .where(eq(conversations.user_id, user_id));
}

export async function deleteConversation(user_id: string): Promise<void> {
  await db.delete(conversations).where(eq(conversations.user_id, user_id));
}

export interface ApiConversationResponse {
  user_id: string;
  first_name: string | null;
  platform: string;
  source: string;
  startedFromComment: string | null;
  status: string;
  funnelStep: number;
  lastActivity: number;
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>;
}

export async function getAllConversations(): Promise<ApiConversationResponse[]> {
  const convos = await db.query.conversations.findMany({
    orderBy: (c) => [desc(c.last_activity)],
  });
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
    lastActivity: convo.last_activity.getTime(),
    messages: (msgsByUser.get(convo.user_id) ?? []).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
      timestamp: m.created_at.getTime(),
    })),
  }));
}
