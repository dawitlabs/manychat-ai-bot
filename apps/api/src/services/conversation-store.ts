import { eq, desc } from 'drizzle-orm';
import { db } from '../db/client';
import { conversations, messages } from '../db/schema';
import type { Conversation, Platform, Source } from '../domain/conversation';

const CONVERSATION_TTL_MS = 23 * 60 * 60 * 1000;
const MAX_HISTORY = 20;

export async function getConversation(user_id: string): Promise<Conversation | null> {
  const convo = await db.query.conversations.findFirst({
    where: eq(conversations.user_id, user_id),
  });
  if (!convo) return null;

  const lastActivity = convo.last_activity.getTime();
  if (Date.now() - lastActivity > CONVERSATION_TTL_MS) return null;

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.user_id, user_id))
    .orderBy(desc(messages.created_at))
    .limit(MAX_HISTORY);

  return {
    user_id: convo.user_id,
    first_name: convo.first_name,
    platform: convo.platform as Platform,
    source: convo.source as Source,
    started_from_comment: convo.started_from_comment,
    last_activity: lastActivity,
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

export async function deleteConversation(user_id: string): Promise<void> {
  await db.delete(conversations).where(eq(conversations.user_id, user_id));
}

export async function getAllConversations(): Promise<Conversation[]> {
  const convos = await db.query.conversations.findMany({
    orderBy: (c) => [desc(c.last_activity)],
  });

  const result: Conversation[] = [];
  for (const convo of convos) {
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.user_id, convo.user_id))
      .orderBy(messages.created_at);

    result.push({
      user_id: convo.user_id,
      first_name: convo.first_name,
      platform: convo.platform as Platform,
      source: convo.source as Source,
      started_from_comment: convo.started_from_comment,
      last_activity: convo.last_activity.getTime(),
      messages: msgs.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.created_at.getTime(),
      })),
    });
  }
  return result;
}
