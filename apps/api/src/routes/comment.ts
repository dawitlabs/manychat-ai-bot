import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { upsertConversation, appendMessage } from '../services/conversation-store';
import { generateReply } from '../services/openai-client';
import { COMMENT_REPLY_PROMPT } from '../domain/prompts';
import { getSettingJson } from '../services/settings-store';
import { webhookLimiter } from '../middleware/rate-limit';

const router = Router();

const bodySchema = z.object({
  user_id: z.string().min(1),
  comment_text: z.string().min(1),
  first_name: z.string().optional(),
  platform: z.enum(['instagram', 'facebook']).optional().default('instagram'),
});

router.post('/comment', webhookLimiter, async (req: Request, res: Response) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ version: 'v2', content: { messages: [{ type: 'text', text: 'Missing required fields.' }] } });
    return;
  }

  const { user_id, comment_text, first_name, platform } = parsed.data;
  const name = first_name ?? 'there';

  console.log(`[${new Date().toISOString()}] [${platform}] Comment from ${user_id} (${name}): ${comment_text}`);

  try {
    const [activeCommentPrompt, botSettings] = await Promise.all([
      getSettingJson<string>('comment_prompt', COMMENT_REPLY_PROMPT),
      getSettingJson<{ bookingLink?: string }>('bot_settings', {}),
    ]);
    const bookingLink = botSettings.bookingLink ?? 'https://calendly.com/kyle-briere-largedumbbells/30';
    const resolvedPrompt = activeCommentPrompt.replace(/https:\/\/calendly\.com\/[^\s"')]+/g, bookingLink);
    const aiReply = await generateReply(
      resolvedPrompt,
      [{ role: 'user', content: `The person's name is "${name}". They commented: "${comment_text}". Write the opening DM.` }],
      { maxTokens: 200, temperature: 0.8 },
    );

    await upsertConversation({
      user_id,
      first_name: first_name ?? null,
      platform,
      source: 'comment',
      started_from_comment: comment_text,
    });
    await appendMessage(user_id, 'assistant', aiReply);

    console.log(`[${new Date().toISOString()}] Opening DM to ${user_id}: ${aiReply}`);

    res.json({ version: 'v2', content: { messages: [{ type: 'text', text: aiReply }] } });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Comment error:`, (err as Error).message);
    res.json({ version: 'v2', content: { messages: [{ type: 'text', text: 'Hey! Thanks for your comment 😊 How can I help you?' }] } });
  }
});

export default router;
