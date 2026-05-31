import { PgBoss } from 'pg-boss';
import type { Job } from 'pg-boss';
import { env } from '../config/env';
import { Sentry } from '../config/sentry';
import { log } from '../lib/logger';
import { classifyConversation } from './openai-client';
import { sendToManychat } from './manychat';
import { updateConversationStatus, markExpiredConversations, getMessageCount } from './conversation-store';
import { appendConversationEvent } from './event-log';
import { notifyBooking } from './notifications';
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
  }
}

async function notifyWorker(jobs: Job<NotifyBookingPayload>[]): Promise<void> {
  for (const job of jobs) {
    await notifyBooking(job.data);
  }
}

async function deliverReplyWorker(jobs: Job<DeliverReplyPayload>[]): Promise<void> {
  for (const job of jobs) {
    const { user_id, text, messageSeq } = job.data;
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
  }
}

async function expireWorker(): Promise<void> {
  await markExpiredConversations();
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

  // Workers — localConcurrency controls parallelism within this process instance
  await boss.work<ClassifyPayload>('classify-conversation', { localConcurrency: 2 }, classifyWorker);
  await boss.work<NotifyBookingPayload>('notify-booking', notifyWorker);
  await boss.work<DeliverReplyPayload>('deliver-reply', deliverReplyWorker);

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
