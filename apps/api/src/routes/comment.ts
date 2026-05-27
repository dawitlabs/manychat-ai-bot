import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { upsertConversation, appendMessage, markExpiredConversations } from '../services/conversation-store';
import { generateReply } from '../services/openai-client';
import { COMMENT_REPLY_PROMPT } from '../domain/prompts';
import { getSettingJson } from '../services/settings-store';
import { webhookLimiter } from '../middleware/rate-limit';
import { verifyManychat } from '../middleware/verify-manychat';
import { formatKyleReply, toManyChatTextMessages } from '../services/response-format';
import { Sentry } from '../config/sentry';
import { env } from '../config/env';
import { log } from '../lib/logger';
import { withMcTimeout } from '../lib/mc-timeout';

const router = Router();

const TIMEOUT_REPLY = { version: 'v2', content: { messages: [{ type: 'text', text: "Hey! Appreciate the comment 🙏 Had a quick tech hiccup — what's your main fitness goal right now?" }] } };

let lastExpiryRun = 0;

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
      const now = Date.now();
      if (now - lastExpiryRun >= 5 * 60_000) {
        lastExpiryRun = now;
        void markExpiredConversations();
      }

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
        ? `The post they commented on was about: "${post_context}". Reference this naturally in your opening — e.g. "saw you commented on my ${post_context} post".`
        : '';
      const aiReply = await generateReply(
        resolvedPrompt,
        [{ role: 'user', content: `The person's name is "${name}". They commented: "${comment_text}". ${postLine} Write the opening DM.` }],
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

      return { version: 'v2', content: { messages: toManyChatTextMessages(aiMessages) } };
    } catch (err) {
      Sentry.captureException(err, { extra: { user_id: req.body?.user_id, platform: req.body?.platform } });
      rlog.error('Comment error', { user_id: req.body?.user_id, msg: (err as Error).message });
      return TIMEOUT_REPLY;
    }
  };

  res.json(await withMcTimeout(handle, TIMEOUT_REPLY));
});

export default router;
