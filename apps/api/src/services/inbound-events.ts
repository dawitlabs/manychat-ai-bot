import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { inboundEvents } from '../db/schema';

export interface InboundEventInput {
  platform: string;
  userId: string;
  messageId?: string | null;
  eventId?: string | null;
  externalMessageId?: string | null;
  manychatEventId?: string | null;
}

export function buildInboundEventKey(input: InboundEventInput): string | null {
  const rawId = input.messageId ?? input.eventId ?? input.externalMessageId ?? input.manychatEventId;
  const id = rawId?.trim();
  if (!id) return null;
  return `${input.platform}:${input.userId}:${id}`;
}

export async function getStoredInboundResponse(eventKey: string): Promise<object | null> {
  const row = await db.query.inboundEvents.findFirst({ where: eq(inboundEvents.event_key, eventKey) });
  return (row?.response_payload as object | null | undefined) ?? null;
}

export async function storeInboundResponse(params: {
  eventKey: string;
  userId: string;
  message: string;
  responsePayload: object;
}): Promise<void> {
  await db
    .insert(inboundEvents)
    .values({
      event_key: params.eventKey,
      user_id: params.userId,
      message: params.message,
      response_payload: params.responsePayload,
    })
    .onConflictDoUpdate({
      target: inboundEvents.event_key,
      set: { response_payload: params.responsePayload },
    });
}
