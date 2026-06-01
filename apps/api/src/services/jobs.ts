import { PgBoss } from 'pg-boss';
import type { Job } from 'pg-boss';
import { env } from '../config/env';
import { Sentry } from '../config/sentry';
import { log } from '../lib/logger';
import { classifyConversation, generateReply } from './openai-client';
import { sendToManychat } from './manychat';
import { updateConversationStatus, markExpiredConversations, getMessageCount, appendMessage } from './conversation-store';
import { appendConversationEvent } from './event-log';
import { notifyBooking } from './notifications';
import { formatKyleReply, toManyChatTextMessages } from './response-format';
import { isInboundDelivered, markInboundDelivered } from './inbound-events';
import { bookedTransitions } from '../lib/metrics';

// ── Payload types ──────────────────────────────────────────────────────────────

export interface ClassifyPayload {
  user_id: string;
  first_name: string | null;
  platform: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  reqId?: string; // request-id from the originating webhook request, for log correlation
}

export interface NotifyBookingPayload {
  user_id: string;
  first_name: string | null;
  platform: string;
}

export interface DeliverReplyPayload {
  user_id: string;
  text: string;    // already-formatted, bubbles joined with \n\n
  platform: string;
  messageSeq?: number; // if set, skip delivery when newer messages have arrived since enqueue
}

export interface GenerateReplyPayload {
  user_id: string;
  platform: string;
  first_name: string | null;
  systemPrompt: string; // fully resolved prompt (booking link + post + knowledge already injected)
  history: Array<{ role: 'user' | 'assistant'; content: string }>; // includes the latest inbound message
  eventKey: string | null; // inbound idempotency key; guards against double delivery
}

// ── Singleton boss ─────────────────────────────────────────────────────────────

let boss: PgBoss | null = null;

export function getBoss(): PgBoss {
  if (!boss) throw new Error('pg-boss not started — call startJobs() first');
  return boss;
}

// ── Workers (pg-boss v12 delivers a batch: Job<T>[]) ──────────────────────────

async function classifyWorker(jobs: Job<ClassifyPayload>[]): Promise<void> {
  for (const job of jobs) {
    const { user_id, first_name, platform, history, reqId } = job.data;
    try {
      const classification = await classifyConversation(history);
      if (!classification) {
        log.warn('[jobs] classify returned null — status preserved', { user_id, reqId });
        continue;
      }

      const { previousStatus, currentStatus } = await updateConversationStatus(
        user_id,
        classification.status,
        classification.funnelStep,
      );

      if (previousStatus !== 'Booked' && currentStatus === 'Booked') {
        bookedTransitions.inc();
        void appendConversationEvent(user_id, 'booked', { platform, first_name, reqId });
        await getBoss().send('notify-booking', { user_id, first_name, platform } satisfies NotifyBookingPayload);
      }

      log.info('[jobs] classified', { user_id, reqId, status: currentStatus, funnelStep: classification.funnelStep });
    } catch (err) {
      log.error('[jobs] classify failed', { user_id, reqId, msg: (err as Error).message });
      Sentry.captureException(err, { extra: { user_id, reqId } });
    }
  }
}

async function notifyWorker(jobs: Job<NotifyBookingPayload>[]): Promise<void> {
  for (const job of jobs) {
    try {
      await notifyBooking(job.data);
    } catch (err) {
      log.error('[jobs] notify-booking failed', { user_id: job.data.user_id, msg: (err as Error).message });
      Sentry.captureException(err, { extra: { user_id: job.data.user_id } });
    }
  }
}

async function deliverReplyWorker(jobs: Job<DeliverReplyPayload>[]): Promise<void> {
  for (const job of jobs) {
    const { user_id, text, messageSeq } = job.data;
    try {
      if (messageSeq !== undefined) {
        const currentCount = await getMessageCount(user_id);
        if (currentCount > messageSeq) {
          log.info('[jobs] deliver-reply: skipped — newer messages arrived', { user_id, messageSeq, currentCount });
          continue;
        }
      }
      const delivered = await sendToManychat(user_id, text);
      if (!delivered) {
        log.warn('[jobs] deliver-reply: ManyChat push failed', { user_id });
      } else {
        log.info('[jobs] deliver-reply: pushed async reply', { user_id });
      }
    } catch (err) {
      log.error('[jobs] deliver-reply failed', { user_id, msg: (err as Error).message });
      Sentry.captureException(err, { extra: { user_id } });
    }
  }
}

// Durable fallback for replies that exceeded the synchronous ManyChat deadline.
// The webhook aborts its in-request generation at the deadline and enqueues this job,
// which regenerates and pushes the reply out of band. Unlike the previous in-process
// floating promise, this survives a crash/redeploy of the webhook instance.
async function generateReplyWorker(jobs: Job<GenerateReplyPayload>[]): Promise<void> {
  for (const job of jobs) {
    const { user_id, platform, first_name, systemPrompt, history, eventKey } = job.data;
    try {
      // At-least-once delivery: short-circuit obvious retries where a prior attempt
      // already delivered. A crash between send and mark can still re-send (rare).
      if (eventKey && (await isInboundDelivered(eventKey))) {
        log.info('[jobs] generate-reply: already delivered, skipping', { user_id });
        continue;
      }

      const aiReply = await generateReply(systemPrompt, history, { userId: user_id });
      const aiMessages = formatKyleReply(aiReply);
      for (const aiMessage of aiMessages) {
        await appendMessage(user_id, 'assistant', aiMessage);
      }

      const delivered = await sendToManychat(user_id, toManyChatTextMessages(aiMessages)[0].text);
      if (!delivered) {
        log.warn('[jobs] generate-reply: ManyChat push failed', { user_id });
      } else if (eventKey) {
        await markInboundDelivered(eventKey);
      }

      const fullHistory = [
        ...history,
        ...aiMessages.map((content) => ({ role: 'assistant' as const, content })),
      ];
      await getBoss().send('classify-conversation', { user_id, first_name, platform, history: fullHistory } satisfies ClassifyPayload);
      log.info('[jobs] generate-reply: delivered async', { user_id, delivered, chunks: aiMessages.length });
    } catch (err) {
      log.error('[jobs] generate-reply failed', { user_id, msg: (err as Error).message });
      Sentry.captureException(err, { extra: { user_id } });
      throw err; // surface to pg-boss so the job is retried, then dead-lettered
    }
  }
}

async function expireWorker(): Promise<void> {
  try {
    await markExpiredConversations();
  } catch (err) {
    log.error('[jobs] expire-conversations failed', { msg: (err as Error).message });
    Sentry.captureException(err);
  }
}

// ── Lifecycle ──────────────────────────────────────────────────────────────────

export async function startJobs(): Promise<void> {
  boss = new PgBoss({
    connectionString: env.DATABASE_URL,
    // Keep the pgboss schema inside the same DB — no extra infra needed
    schema: 'pgboss',
  });

  boss.on('error', (err: Error) => {
    log.error('[jobs] pg-boss error', { message: err.message });
    Sentry.captureException(err);
  });

  await boss.start();

  // pg-boss v10+ requires queues to exist before workers can subscribe, and a queue's
  // dead-letter target must exist before the queue that references it — so create the
  // dead-letter queues first, then the main queues in a second pass.
  await Promise.all([
    boss.createQueue('classify-conversation-dlq'),
    boss.createQueue('notify-booking-dlq'),
    boss.createQueue('deliver-reply-dlq'),
    boss.createQueue('generate-reply-dlq'),
  ]);
  await Promise.all([
    boss.createQueue('classify-conversation', { retryLimit: 3, retryDelay: 10, deadLetter: 'classify-conversation-dlq' }),
    boss.createQueue('notify-booking', { retryLimit: 5, retryDelay: 30, deadLetter: 'notify-booking-dlq' }),
    boss.createQueue('deliver-reply', { retryLimit: 5, retryDelay: 5, deadLetter: 'deliver-reply-dlq' }),
    boss.createQueue('generate-reply', { retryLimit: 3, retryDelay: 5, deadLetter: 'generate-reply-dlq' }),
    boss.createQueue('expire-conversations'),
  ]);

  // Workers — localConcurrency controls parallelism within this process instance
  await boss.work<ClassifyPayload>('classify-conversation', { localConcurrency: 2 }, classifyWorker);
  await boss.work<NotifyBookingPayload>('notify-booking', notifyWorker);
  await boss.work<DeliverReplyPayload>('deliver-reply', deliverReplyWorker);
  await boss.work<GenerateReplyPayload>('generate-reply', { localConcurrency: 2 }, generateReplyWorker);

  // Cron: archive expired conversations every 30 minutes.
  // Replaces the per-request lastExpiryRun throttle — correct across multiple instances.
  await boss.schedule('expire-conversations', '*/30 * * * *', null);
  await boss.work('expire-conversations', expireWorker);

  log.info('[jobs] pg-boss started');
}

export async function stopJobs(): Promise<void> {
  if (!boss) return;
  await boss.stop();
  boss = null;
  log.info('[jobs] pg-boss stopped');
}
