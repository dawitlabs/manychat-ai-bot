import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getAllConversations, setConversationPaused, appendMessage } from '../services/conversation-store';
import { requireAdmin } from '../middleware/require-admin';
import { recordAdminAudit } from '../services/admin-audit';
import { sendToManychat } from '../services/manychat';

const router = Router();

router.get('/conversations', requireAdmin, async (req: Request, res: Response) => {
  const rawLimit = Number(req.query.limit);
  const limit = Math.min(Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 50, 200);
  const rawCursor = Number(req.query.cursor);
  const cursor = req.query.cursor && Number.isFinite(rawCursor) ? rawCursor : undefined;
  const convos = await getAllConversations({ limit, cursor });
  res.json(convos);
});

const pauseSchema = z.object({ paused: z.boolean() });

router.patch('/conversations/:user_id/pause', requireAdmin, async (req: Request, res: Response) => {
  const { user_id } = req.params;
  const parsed = pauseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Body must be { paused: boolean }' });
    return;
  }
  await setConversationPaused(user_id, parsed.data.paused);
  await recordAdminAudit({
    actor: 'admin',
    action: parsed.data.paused ? 'conversation.paused' : 'conversation.resumed',
    target: user_id,
  });
  res.json({ ok: true, paused: parsed.data.paused });
});

const sendSchema = z.object({ text: z.string().min(1).max(2000) });

router.post('/conversations/:user_id/send', requireAdmin, async (req: Request, res: Response) => {
  const { user_id } = req.params;
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Body must be { text: string }' });
    return;
  }

  const { text } = parsed.data;

  // Record in DB first — always succeeds even if ManyChat is not configured
  await appendMessage(user_id, 'assistant', text);

  // Attempt delivery via ManyChat (sendContent → setCustomField + sendFlow fallback)
  const delivered = await sendToManychat(user_id, text);

  await recordAdminAudit({ actor: 'admin', action: 'conversation.manual_send', target: user_id });
  res.json({ ok: true, delivered, manychatConfigured: true });
});

export default router;
