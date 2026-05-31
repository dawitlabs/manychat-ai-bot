import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { upsertConversation, appendMessage } from '../services/conversation-store';
import { generateReply } from '../services/openai-client';
import { COMMENT_REPLY_PROMPT } from '../domain/prompts';
import { getSettingJson } from '../services/settings-store';
import { webhookLimiter } from '../middleware/rate-limit';
import { verifyManychat } from '../middleware/verify-manychat';
import { formatKyleReply, toManyChatTextMessages } from '../services/response-format';
import { resolvePostContext } from '../services/post-context';
import { Sentry } from '../config/sentry';
import { env } from '../config/env';
import { log } from '../lib/logger';
import { getBoss } from '../services/jobs';
import type { DeliverReplyPayload } from '../services/jobs';

const router = Router();

const TIMEOUT_REPLY = { version: 'v2', content: { messages: [{ type: 'text', text: "Hey! Appreciate the comment 🙏 Had a quick tech hiccup — what's your main fitness goal right now?" }] } };
const EMPTY_PAYLOAD = { version: 'v2', content: { messages: [] } };

const bodySchema = z.object({
  user_id: z.string().min(1),
  comment_text: z.string().min(1),
  first_name: z.string().optional(),
  platform: z.enum(['instagram', 'facebook']).optional().default('instagram'),
  post_context: z.string().optional(),
});

router.post('/comment', webhookLimiter, verifyManychat, async (req: Request, res: Response) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ version: 'v2', content: { messages: [{ type: 'text', text: 'Missing required fields.' }] } });
    return;
  }

  const { user_id, comment_text, first_name, platform, post_context } = parsed.data;
  const name = first_name ?? 'there';
  const rlog = log.withRequest(req);

  if (env.LOG_LEVEL === 'debug') {
    rlog.debug('Comment received', { platform, user_id, name, comment_text });
  } else {
    rlog.info('Comment received', { platform, user_id, chars: comment_text.length });
  }

  const handle = async (): Promise<object> => {
    try {
      const [activeCommentPrompt, botSettings] = await Promise.all([
        getSettingJson<string>('comment_prompt', COMMENT_REPLY_PROMPT),
        getSettingJson<{ botActive?: boolean; bookingLink?: string }>('bot_settings', {}),
      ]);

      if (botSettings.botActive === false) {
        rlog.info('Bot disabled — dropping comment', { platform, user_id });
        return { version: 'v2', content: { messages: [] } };
      }

      const bookingLink = botSettings.bookingLink ?? env.CALENDLY_URL;
      const resolvedPrompt = activeCommentPrompt.replace(/https:\/\/calendly\.com\/[^\s"')]+/g, bookingLink);

      const postLine = post_context
        ? `\n\n${await resolvePostContext(post_context, platform)}\n\nReference the specific post content naturally in your opening DM.`
        : '';

      const aiReply = await generateReply(
        resolvedPrompt,
        [{ role: 'user', content: `The person's name is "${name}". They commented: "${comment_text}".${postLine} Write the opening DM.` }],
        {},
      );
      const aiMessages = formatKyleReply(aiReply, { maxMessages: 2 });

      await upsertConversation({
        user_id,
        first_name: first_name ?? null,
        platform,
        source: 'comment',
        started_from_comment: comment_text,
        post_context: post_context ?? null,
      });
      for (const aiMessage of aiMessages) {
        await appendMessage(user_id, 'assistant', aiMessage);
      }

      if (env.LOG_LEVEL === 'debug') {
        rlog.debug('Opening DM sent', { user_id, reply: aiMessages.join(' | ') });
      } else {
        rlog.info('Opening DM sent', { platform, user_id, chunks: aiMessages.length });
      }

      if (deadlinePassed) {
        const combinedText = toManyChatTextMessages(aiMessages)[0].text;
        void getBoss().send('deliver-reply', { user_id, text: combinedText, platform } satisfies DeliverReplyPayload)
          .catch((err) => rlog.error('deliver-reply enqueue error', { user_id, msg: (err as Error).message }));
        rlog.info('Opening DM queued for async delivery', { platform, user_id });
        return EMPTY_PAYLOAD;
      }

      return { version: 'v2', content: { messages: toManyChatTextMessages(aiMessages) } };
    } catch (err) {
      Sentry.captureException(err, { extra: { user_id: req.body?.user_id, platform: req.body?.platform } });
      rlog.error('Comment error', { user_id: req.body?.user_id, msg: (err as Error).message });
      if (deadlinePassed) {
        void getBoss().send('deliver-reply', { user_id: req.body?.user_id ?? '', text: TIMEOUT_REPLY.content.messages[0].text, platform } satisfies DeliverReplyPayload)
          .catch(() => { /* best effort */ });
      }
      return TIMEOUT_REPLY;
    }
  };

  const DEADLINE_MS = 4_000;
  let deadlinePassed = false;
  const deadlinePromise = new Promise<object>((resolve) =>
    setTimeout(() => { deadlinePassed = true; resolve(EMPTY_PAYLOAD); }, DEADLINE_MS),
  );

  res.json(await Promise.race([handle(), deadlinePromise]));
});

export default router;
