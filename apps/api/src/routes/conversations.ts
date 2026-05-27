import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getAllConversations, setConversationPaused, appendMessage } from '../services/conversation-store';
import { requireAdmin } from '../middleware/require-admin';
import { recordAdminAudit } from '../services/admin-audit';
import { env } from '../config/env';
import { log } from '../lib/logger';

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
  const rlog = log.withRequest(req);

  // Record in DB first — always succeeds even if ManyChat is not configured
  await appendMessage(user_id, 'assistant', text);

  // Attempt delivery via ManyChat
  // Strategy: try sendContent first (works for Facebook), fall back to custom field + flow (works for Instagram)
  const IG_SEND_FLOW_NS = 'content20260527181536_194635';
  let delivered = false;
  if (env.MANYCHAT_API_KEY) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.MANYCHAT_API_KEY}`,
      };

      // 1. Try sendContent (works for Facebook subscribers with active window)
      const mcRes = await fetch('https://api.manychat.com/fb/sending/sendContent', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          subscriber_id: user_id,
          data: { version: 'v2', content: { messages: [{ type: 'text', text }] } },
        }),
      });

      if (mcRes.ok) {
        delivered = true;
      } else {
        // 2. sendContent failed — fall back to custom field + Instagram flow
        const fieldRes = await fetch('https://api.manychat.com/fb/subscriber/setCustomFieldByName', {
          method: 'POST',
          headers,
          body: JSON.stringify({ subscriber_id: user_id, field_name: 'ai_response', field_value: text }),
        });

        if (fieldRes.ok) {
          const flowRes = await fetch('https://api.manychat.com/fb/sending/sendFlow', {
            method: 'POST',
            headers,
            body: JSON.stringify({ subscriber_id: user_id, flow_ns: IG_SEND_FLOW_NS }),
          });

          if (flowRes.ok) {
            delivered = true;
          } else {
            const body = await flowRes.text().catch(() => '');
            rlog.warn('ManyChat sendFlow failed', { user_id, status: flowRes.status, body });
          }
        } else {
          const body = await fieldRes.text().catch(() => '');
          rlog.warn('ManyChat setCustomField failed', { user_id, status: fieldRes.status, body });
        }
      }
    } catch (err) {
      rlog.warn('ManyChat send error', { user_id, msg: (err as Error).message });
    }
  }

  await recordAdminAudit({ actor: 'admin', action: 'conversation.manual_send', target: user_id });
  res.json({ ok: true, delivered, manychatConfigured: !!env.MANYCHAT_API_KEY });
});

export default router;
