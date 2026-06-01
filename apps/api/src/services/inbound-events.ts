import { and, eq, isNull, lt } from 'drizzle-orm';
import { db } from '../db/client';
import { inboundEvents } from '../db/schema';

// A claim whose response_payload is still null after this long is treated as abandoned
// (the processing instance crashed or was redeployed mid-flight) and may be reclaimed,
// so a ManyChat retry or user re-send can recover instead of being suppressed forever.
export const STALE_CLAIM_MS = 60_000;

export function isClaimStale(claimedAt: Date, now: number, staleMs: number = STALE_CLAIM_MS): boolean {
  return now - claimedAt.getTime() >= staleMs;
}

export interface InboundEventInput {
  platform: string;
  userId: string;
  messageId?: string | null;
  eventId?: string | null;
  externalMessageId?: string | null;
  manychatEventId?: string | null;
  message?: string;
  timestamp?: number;
}

// FNV-1a 32-bit
function simpleHash(str: string): string {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (Math.imul(h, 16777619)) >>> 0;
  }
  return h.toString(36);
}

export function buildInboundEventKey(input: InboundEventInput): string | null {
  const rawId = input.messageId ?? input.eventId ?? input.externalMessageId ?? input.manychatEventId;
  const id = rawId?.trim();
  if (id) return `${input.platform}:${input.userId}:${id}`;

  // Fallback: content-hash with a 2-minute bucket so genuine re-sends after the
  // retry window are treated as new messages, but rapid ManyChat retries are deduped.
  if (input.message) {
    const bucket = Math.floor((input.timestamp ?? Date.now()) / 120_000);
    const hash = simpleHash(`${input.userId}:${input.message}`);
    return `${input.platform}:${input.userId}:c:${bucket}:${hash}`;
  }

  return null;
}

const EMPTY_PAYLOAD = { version: 'v2', content: { messages: [] } };

/**
 * Atomically claim ownership of an inbound event.
 *
 * - First caller for a given eventKey: inserts a pending row and returns 'claimed'.
 * - Subsequent callers (retries): find the existing row and return either the stored
 *   response payload (if processing completed) or EMPTY_PAYLOAD (if still in-flight).
 *
 * This prevents ManyChat retries from triggering duplicate AI calls.
 */
export async function claimOrGetStoredInboundEvent(
  eventKey: string,
  userId: string,
  message: string,
): Promise<'claimed' | object> {
  const inserted = await db
    .insert(inboundEvents)
    .values({ event_key: eventKey, user_id: userId, message, response_payload: null })
    .onConflictDoNothing()
    .returning({ id: inboundEvents.id });

  if (inserted.length > 0) return 'claimed';

  const existing = await db.query.inboundEvents.findFirst({
    where: eq(inboundEvents.event_key, eventKey),
    columns: { response_payload: true, claimed_at: true },
  });

  if (existing?.response_payload) return existing.response_payload as object;

  // In-flight: suppress the retry unless the original claim is stale, in which case
  // atomically take ownership so a crashed-mid-flight message can still be answered.
  if (existing && isClaimStale(existing.claimed_at, Date.now())) {
    const reclaimed = await db
      .update(inboundEvents)
      .set({ claimed_at: new Date(), message })
      .where(
        and(
          eq(inboundEvents.event_key, eventKey),
          isNull(inboundEvents.response_payload),
          lt(inboundEvents.claimed_at, new Date(Date.now() - STALE_CLAIM_MS)),
        ),
      )
      .returning({ id: inboundEvents.id });
    if (reclaimed.length > 0) return 'claimed';
  }

  return EMPTY_PAYLOAD;
}

/**
 * Returns true if an outbound reply has already been delivered for this inbound event.
 * Used by the durable generate-reply fallback to avoid double-sending on job retries.
 */
export async function isInboundDelivered(eventKey: string): Promise<boolean> {
  const row = await db.query.inboundEvents.findFirst({
    where: eq(inboundEvents.event_key, eventKey),
    columns: { delivered_at: true },
  });
  return Boolean(row?.delivered_at);
}

/** Mark an inbound event as delivered. Idempotent. */
export async function markInboundDelivered(eventKey: string): Promise<void> {
  await db.update(inboundEvents).set({ delivered_at: new Date() }).where(eq(inboundEvents.event_key, eventKey));
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
