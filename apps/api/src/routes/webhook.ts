import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getConversation, upsertConversation, appendMessage } from '../services/conversation-store';
import { generateReply } from '../services/openai-client';
import { SYSTEM_PROMPT } from '../domain/prompts';
import { getSettingJson } from '../services/settings-store';
import { webhookLimiter } from '../middleware/rate-limit';
import { verifyManychat } from '../middleware/verify-manychat';
import { formatKyleReply, toManyChatTextMessages } from '../services/response-format';
import { sendToManychat } from '../services/manychat';
import { getDirectAnswer } from '../services/direct-answers';
import { resolvePostContext } from '../services/post-context';
import { getRuntimeKnowledgeContext } from '../services/knowledge-search';
import { buildInboundEventKey, claimOrGetStoredInboundEvent, storeInboundResponse, markInboundDelivered } from '../services/inbound-events';
import { getBoss } from '../services/jobs';
import type { ClassifyPayload, GenerateReplyPayload } from '../services/jobs';
import { Sentry } from '../config/sentry';
import { env } from '../config/env';
import { log } from '../lib/logger';
import {
  webhookRequests,
  webhookDuration,
  directAnswerHits,
} from '../lib/metrics';

const router = Router();

const TIMEOUT_REPLY = { version: 'v2', content: { messages: [{ type: 'text', text: "Yo my bad — hit a snag on my end. Send that again and I'll get right back to you 💪" }] } };
const EMPTY_PAYLOAD = { version: 'v2', content: { messages: [] } };

const bodySchema = z.object({
  user_id: z.string().min(1),
  message: z.string().min(1),
  first_name: z.string().optional(),
  platform: z.enum(['instagram', 'facebook']).optional().default('instagram'),
  post_context: z.string().optional(),
  message_id: z.string().optional(),
  event_id: z.string().optional(),
  external_message_id: z.string().optional(),
  manychat_event_id: z.string().optional(),
});

function normalizeRepeatedText(message: string): string {
  return message
    .toLowerCase()
    .replace(/[^\w\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isRepeatedUserQuestion(
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>,
  message: string,
): boolean {
  const normalized = normalizeRepeatedText(message);
  if (!normalized) return false;
  const recentUserMessages = messages
    .filter((entry) => entry.role === 'user')
    .slice(-3);
  return recentUserMessages.some((entry) => normalizeRepeatedText(entry.content) === normalized);
}

router.post('/webhook', webhookLimiter, verifyManychat, async (req: Request, res: Response) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ version: 'v2', content: { messages: [{ type: 'text', text: 'Missing required fields.' }] } });
    return;
  }

  const {
    user_id,
    message,
    first_name,
    platform,
    post_context,
    message_id,
    event_id,
    external_message_id,
    manychat_event_id,
  } = parsed.data;
  const source = platform === 'facebook' ? 'facebook_dm' : 'instagram_dm';
  const rlog = log.withRequest(req);
  const eventKey = buildInboundEventKey({
    platform,
    userId: user_id,
    messageId: message_id,
    eventId: event_id,
    externalMessageId: external_message_id,
    manychatEventId: manychat_event_id,
    message,
  });

  if (env.LOG_LEVEL === 'debug') {
    rlog.debug('DM received', { platform, user_id, message });
  } else {
    rlog.info('DM received', { platform, user_id, chars: message.length });
  }

  // Outcome label for metrics — set at every exit point inside handle()
  let outcome = 'error';

  const handle = async (): Promise<object> => {
    try {
      if (eventKey) {
        const claim = await claimOrGetStoredInboundEvent(eventKey, user_id, message);
        if (claim !== 'claimed') {
          rlog.info('Duplicate event — skipping retry', { platform, user_id });
          outcome = 'replied';
          return claim as object;
        }
      }

      const [activePrompt, botSettings] = await Promise.all([
        getSettingJson<string>('system_prompt', SYSTEM_PROMPT),
        getSettingJson<{ botActive?: boolean; bookingLink?: string }>('bot_settings', {}),
      ]);

      if (botSettings.botActive === false) {
        rlog.info('Bot disabled — dropping message', { platform, user_id });
        outcome = 'dropped';
        return { version: 'v2', content: { messages: [] } };
      }

      await upsertConversation({ user_id, first_name: first_name ?? null, platform, source, post_context });

      const convo = await getConversation(user_id);

      if (convo?.paused) {
        await appendMessage(user_id, 'user', message);
        rlog.info('Bot paused — message recorded, no AI reply', { platform, user_id });
        outcome = 'paused';
        return { version: 'v2', content: { messages: [] } };
      }

      const bookingLink = botSettings.bookingLink ?? env.CALENDLY_URL;
      const priorHistory = convo?.messages.map((m) => ({ role: m.role, content: m.content })) ?? [];
      const history = [...priorHistory, { role: 'user' as const, content: message }];
      const repeatedQuestion = convo ? isRepeatedUserQuestion(convo.messages, message) : false;

      const directAnswer = getDirectAnswer(message, { repeated: repeatedQuestion, bookingLink });
      if (directAnswer) {
        directAnswerHits.inc();
        await appendMessage(user_id, 'user', message);
        // Store the reply as one assistant turn (matching how it's delivered), not one row
        // per bubble — per-bubble storage fragments the history the model sees on later turns.
        const directText = toManyChatTextMessages(directAnswer)[0].text;
        await appendMessage(user_id, 'assistant', directText);

        const fullHistory = [...history, { role: 'assistant' as const, content: directText }];
        // Enqueue classification as a durable job — survives restarts, safe across instances
        void getBoss().send('classify-conversation', {
          user_id, first_name: first_name ?? null, platform, history: fullHistory, reqId: req.id,
        } satisfies ClassifyPayload).catch((err) => rlog.error('classify enqueue error', { user_id, msg: (err as Error).message }));

        if (env.LOG_LEVEL === 'debug') {
          rlog.debug('Direct reply sent', { user_id, reply: directAnswer.join(' | ') });
        } else {
          rlog.info('Direct reply sent', { platform, user_id });
        }

        outcome = 'direct_answer';
        return { version: 'v2', content: { messages: toManyChatTextMessages(directAnswer) } };
      }

      // Persist the inbound message before calling OpenAI so a generation failure or
      // deadline abort never drops the user's turn from conversation history.
      await appendMessage(user_id, 'user', message);

      let resolvedPrompt = activePrompt.replace(/https:\/\/calendly\.com\/[^\s"')]+/g, bookingLink);
      if (convo?.post_context) {
        resolvedPrompt += `\n\n${await resolvePostContext(convo.post_context, platform)}`;
      }
      const knowledgeContext = await getRuntimeKnowledgeContext(
        [...priorHistory.slice(-6).map((entry) => entry.content), message].join('\n'),
      );
      if (knowledgeContext) {
        resolvedPrompt += `\n\n${knowledgeContext}`;
      }
      if (repeatedQuestion) {
        resolvedPrompt += '\n\nREPEATED QUESTION: The lead repeated the same message. Treat that as a signal the previous answer was not clear enough. Answer more directly, be specific, and move the conversation forward without repeating the same wording.';
      }

      // Durable crash-recovery backstop: if this instance dies mid-generation, this job
      // regenerates and delivers ~30s later. It no-ops once the in-request path marks the
      // event delivered (the normal case). Fire-and-forget so it never adds latency to the
      // reply path — a crash in the tiny window before it commits is an acceptable trade.
      if (eventKey) {
        void getBoss().send('generate-reply', {
          user_id, platform, first_name: first_name ?? null, systemPrompt: resolvedPrompt, history, eventKey,
        } satisfies GenerateReplyPayload, { startAfter: 30, singletonKey: eventKey })
          .catch((err) => rlog.error('generate-reply enqueue error', { user_id, msg: (err as Error).message }));
      }

      const aiReply = await generateReply(resolvedPrompt, history, { userId: user_id });
      const aiMessages = formatKyleReply(aiReply);
      // Store the whole reply as one assistant turn (matching delivery). Storing one row per
      // bubble fragments the history window, which teaches the model to reply with just an
      // intro line on later turns.
      const assistantText = toManyChatTextMessages(aiMessages)[0].text;
      await appendMessage(user_id, 'assistant', assistantText);

      const fullHistory = [...history, { role: 'assistant' as const, content: assistantText }];
      // Enqueue classification as a durable job — survives restarts, safe across instances
      void getBoss().send('classify-conversation', {
        user_id, first_name: first_name ?? null, platform, history: fullHistory, reqId: req.id,
      } satisfies ClassifyPayload).catch((err) => rlog.error('classify enqueue error', { user_id, msg: (err as Error).message }));

      if (deadlinePassed) {
        // Past the deadline — ManyChat already received an empty response, so push this
        // same reply via the ManyChat API now. No regeneration: we reuse what we just made.
        const delivered = await sendToManychat(user_id, assistantText);
        if (eventKey && delivered) void markInboundDelivered(eventKey).catch(() => { /* best effort */ });
        rlog.info('AI reply delivered async', { platform, user_id, delivered, chunks: aiMessages.length });
        outcome = 'replied_async';
        return EMPTY_PAYLOAD;
      }

      // Delivered synchronously via the HTTP response — record it so the backstop no-ops.
      if (eventKey) {
        void markInboundDelivered(eventKey).catch(() => { /* best effort */ });
      }

      if (env.LOG_LEVEL === 'debug') {
        rlog.debug('AI reply sent', { user_id, reply: aiMessages.join(' | ') });
      } else {
        rlog.info('AI reply sent', { platform, user_id, inChars: message.length, chunks: aiMessages.length });
      }

      outcome = 'replied';
      return { version: 'v2', content: { messages: toManyChatTextMessages(aiMessages) } };
    } catch (err) {
      Sentry.captureException(err, { extra: { user_id: req.body?.user_id, platform: req.body?.platform, reqId: req.id } });
      rlog.error('Webhook error', { user_id: req.body?.user_id, msg: (err as Error).message });
      outcome = 'error';
      return TIMEOUT_REPLY;
    }
  };

  // MUST stay at or below ManyChat's External Request timeout (~4-5s). If it's higher, a
  // reply finishing after ManyChat hangs up but before this deadline is returned to a dead
  // connection AND never falls back to async — i.e. silently dropped mid-conversation.
  // Keeping it at 4s guarantees slow replies cross into the async-delivery path instead.
  const DEADLINE_MS = 4_000;
  let deadlinePassed = false;
  const deadlinePromise = new Promise<object>((resolve) =>
    setTimeout(() => { deadlinePassed = true; resolve(EMPTY_PAYLOAD); }, DEADLINE_MS),
  );

  const stopDurationTimer = webhookDuration.startTimer({ platform });
  const responsePayload = await Promise.race([handle(), deadlinePromise]);

  // When the deadline wins, handle() is still running so `outcome` is its initial value.
  const finalOutcome = responsePayload === EMPTY_PAYLOAD && outcome === 'error' ? 'replied_async' : outcome;
  stopDurationTimer({ platform, outcome: finalOutcome });
  webhookRequests.inc({ platform, outcome: finalOutcome });
  if (eventKey) {
    void storeInboundResponse({ eventKey, userId: user_id, message, responsePayload })
      .catch((err) => rlog.warn('Inbound event store failed', { user_id, msg: (err as Error).message }));
  }
  res.json(responsePayload);
});

export default router;
