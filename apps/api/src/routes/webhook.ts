import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getConversation, upsertConversation, appendMessage, updateConversationStatus, markExpiredConversations } from '../services/conversation-store';
import { generateReply, classifyConversation } from '../services/openai-client';
import { SYSTEM_PROMPT } from '../domain/prompts';
import { getSettingJson } from '../services/settings-store';
import { webhookLimiter } from '../middleware/rate-limit';
import { verifyManychat } from '../middleware/verify-manychat';
import { formatKyleReply, toManyChatTextMessages } from '../services/response-format';
import { getDirectAnswer } from '../services/direct-answers';
import { notifyBooking } from '../services/notifications';
import { Sentry } from '../config/sentry';
import { env } from '../config/env';
import { log } from '../lib/logger';
import { withMcTimeout } from '../lib/mc-timeout';

const router = Router();

const TIMEOUT_REPLY = { version: 'v2', content: { messages: [{ type: 'text', text: "Yo my bad — hit a snag on my end. Send that again and I'll get right back to you 💪" }] } };

let lastExpiryRun = 0;

const bodySchema = z.object({
  user_id: z.string().min(1),
  message: z.string().min(1),
  first_name: z.string().optional(),
  platform: z.enum(['instagram', 'facebook']).optional().default('instagram'),
});

router.post('/webhook', webhookLimiter, verifyManychat, async (req: Request, res: Response) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ version: 'v2', content: { messages: [{ type: 'text', text: 'Missing required fields.' }] } });
    return;
  }

  const { user_id, message, first_name, platform } = parsed.data;
  const source = platform === 'facebook' ? 'facebook_dm' : 'instagram_dm';
  const rlog = log.withRequest(req);

  if (env.LOG_LEVEL === 'debug') {
    rlog.debug('DM received', { platform, user_id, message });
  } else {
    rlog.info('DM received', { platform, user_id, chars: message.length });
  }

  const handle = async (): Promise<object> => {
    try {
      const now = Date.now();
      if (now - lastExpiryRun >= 5 * 60_000) {
        lastExpiryRun = now;
        void markExpiredConversations();
      }

      const [activePrompt, botSettings] = await Promise.all([
        getSettingJson<string>('system_prompt', SYSTEM_PROMPT),
        getSettingJson<{ botActive?: boolean; bookingLink?: string }>('bot_settings', {}),
      ]);

      if (botSettings.botActive === false) {
        rlog.info('Bot disabled — dropping message', { platform, user_id });
        return { version: 'v2', content: { messages: [] } };
      }

      await upsertConversation({ user_id, first_name: first_name ?? null, platform, source });

      const convo = await getConversation(user_id);

      if (convo?.paused) {
        await appendMessage(user_id, 'user', message);
        rlog.info('Bot paused — message recorded, no AI reply', { platform, user_id });
        return { version: 'v2', content: { messages: [] } };
      }

      const priorHistory = convo?.messages.map((m) => ({ role: m.role, content: m.content })) ?? [];
      const history = [...priorHistory, { role: 'user' as const, content: message }];

      const directAnswer = getDirectAnswer(message);
      if (directAnswer) {
        await appendMessage(user_id, 'user', message);
        for (const aiMessage of directAnswer) {
          await appendMessage(user_id, 'assistant', aiMessage);
        }

        const fullHistory = [
          ...history,
          ...directAnswer.map((content) => ({ role: 'assistant' as const, content })),
        ];
        // classify in background — don't block the ManyChat response
        void classifyConversation(fullHistory).then((classification) => {
          if (!classification) { rlog.warn('classify failed — status preserved', { user_id }); return; }
          return updateConversationStatus(user_id, classification.status, classification.funnelStep).then(
            ({ previousStatus, currentStatus }) => {
              if (previousStatus !== 'Booked' && currentStatus === 'Booked') {
                void notifyBooking({ user_id, first_name: first_name ?? null, platform });
              }
            },
          );
        }).catch((err) => rlog.error('classify bg error', { user_id, msg: (err as Error).message }));

        if (env.LOG_LEVEL === 'debug') {
          rlog.debug('Direct reply sent', { user_id, reply: directAnswer.join(' | ') });
        } else {
          rlog.info('Direct reply sent', { platform, user_id });
        }

        return { version: 'v2', content: { messages: toManyChatTextMessages(directAnswer) } };
      }

      const bookingLink = botSettings.bookingLink ?? env.CALENDLY_URL;
      let resolvedPrompt = activePrompt.replace(/https:\/\/calendly\.com\/[^\s"')]+/g, bookingLink);
      if (convo?.post_context) {
        resolvedPrompt += `\n\nCONTEXT: This lead came from a post about "${convo.post_context}". Keep this topic in mind and reference it naturally when relevant.`;
      }

      const aiReply = await generateReply(resolvedPrompt, history, { userId: user_id });
      const aiMessages = formatKyleReply(aiReply);

      await appendMessage(user_id, 'user', message);
      for (const aiMessage of aiMessages) {
        await appendMessage(user_id, 'assistant', aiMessage);
      }

      const fullHistory = [
        ...history,
        ...aiMessages.map((content) => ({ role: 'assistant' as const, content })),
      ];
      // classify in background — don't block the ManyChat response
      void classifyConversation(fullHistory).then((classification) => {
        if (!classification) { rlog.warn('classify failed — status preserved', { user_id }); return; }
        return updateConversationStatus(user_id, classification.status, classification.funnelStep).then(
          ({ previousStatus, currentStatus }) => {
            if (previousStatus !== 'Booked' && currentStatus === 'Booked') {
              void notifyBooking({ user_id, first_name: first_name ?? null, platform });
            }
          },
        );
      }).catch((err) => rlog.error('classify bg error', { user_id, msg: (err as Error).message }));

      if (env.LOG_LEVEL === 'debug') {
        rlog.debug('AI reply sent', { user_id, reply: aiMessages.join(' | ') });
      } else {
        rlog.info('AI reply sent', { platform, user_id, inChars: message.length, chunks: aiMessages.length });
      }

      return { version: 'v2', content: { messages: toManyChatTextMessages(aiMessages) } };
    } catch (err) {
      Sentry.captureException(err, { extra: { user_id: req.body?.user_id, platform: req.body?.platform } });
      rlog.error('Webhook error', { user_id: req.body?.user_id, msg: (err as Error).message });
      return TIMEOUT_REPLY;
    }
  };

  res.json(await withMcTimeout(handle, TIMEOUT_REPLY));
});

export default router;
