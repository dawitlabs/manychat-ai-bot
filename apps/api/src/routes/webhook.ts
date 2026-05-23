import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getConversation, upsertConversation, appendMessage, updateConversationStatus } from '../services/conversation-store';
import { generateReply, classifyConversation } from '../services/openai-client';
import { SYSTEM_PROMPT } from '../domain/prompts';
import { getSettingJson } from '../services/settings-store';
import { webhookLimiter } from '../middleware/rate-limit';
import { formatKyleReply, toManyChatTextMessages } from '../services/response-format';

const router = Router();

const bodySchema = z.object({
  user_id: z.string().min(1),
  message: z.string().min(1),
  first_name: z.string().optional(),
  platform: z.enum(['instagram', 'facebook']).optional().default('instagram'),
});

router.post('/webhook', webhookLimiter, async (req: Request, res: Response) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ version: 'v2', content: { messages: [{ type: 'text', text: 'Missing required fields.' }] } });
    return;
  }

  const { user_id, message, first_name, platform } = parsed.data;
  const source = platform === 'facebook' ? 'facebook_dm' : 'instagram_dm';

  console.log(`[${new Date().toISOString()}] [${platform}] DM from ${user_id}: ${message}`);

  try {
    await upsertConversation({ user_id, first_name: first_name ?? null, platform, source });
    await appendMessage(user_id, 'user', message);

    const convo = await getConversation(user_id);
    const history = convo?.messages.map((m) => ({ role: m.role, content: m.content })) ?? [{ role: 'user' as const, content: message }];

    const [activePrompt, botSettings] = await Promise.all([
      getSettingJson<string>('system_prompt', SYSTEM_PROMPT),
      getSettingJson<{ bookingLink?: string }>('bot_settings', {}),
    ]);
    const bookingLink = botSettings.bookingLink ?? 'https://calendly.com/kyle-briere-largedumbbells/30';
    let resolvedPrompt = activePrompt.replace(/https:\/\/calendly\.com\/[^\s"')]+/g, bookingLink);
    if (convo?.post_context) {
      resolvedPrompt += `\n\nCONTEXT: This lead came from a post about "${convo.post_context}". Keep this topic in mind and reference it naturally when relevant.`;
    }

    const aiReply = await generateReply(resolvedPrompt, history);
    const aiMessages = formatKyleReply(aiReply);
    for (const aiMessage of aiMessages) {
      await appendMessage(user_id, 'assistant', aiMessage);
    }

    const fullHistory = [
      ...history,
      ...aiMessages.map((content) => ({ role: 'assistant' as const, content })),
    ];
    const { funnelStep, status } = await classifyConversation(fullHistory);
    await updateConversationStatus(user_id, status, funnelStep);

    console.log(`[${new Date().toISOString()}] AI reply to ${user_id}: ${aiMessages.join(' | ')}`);

    res.json({ version: 'v2', content: { messages: toManyChatTextMessages(aiMessages) } });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Webhook error:`, (err as Error).message);
    res.json({ version: 'v2', content: { messages: [{ type: 'text', text: "Sorry, I'm having trouble right now. Please try again in a moment!" }] } });
  }
});

export default router;
