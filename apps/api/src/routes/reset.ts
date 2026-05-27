import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { deleteConversation, deleteAllConversations } from '../services/conversation-store';
import { requireAdmin } from '../middleware/require-admin';
import { recordAdminAudit } from '../services/admin-audit';

const router = Router();

const bodySchema = z.object({ user_id: z.string().min(1) });
const confirmSchema = z.object({ confirm: z.literal('DELETE_ALL_CONVERSATIONS') });

router.post('/reset', requireAdmin, async (req: Request, res: Response) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'user_id required' });
    return;
  }
  await deleteConversation(parsed.data.user_id);
  void recordAdminAudit({ actor: 'admin-key', action: 'reset', target: parsed.data.user_id });
  res.json({ success: true });
});

router.post('/reset-all', requireAdmin, async (req: Request, res: Response) => {
  const parsed = confirmSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Body must include { "confirm": "DELETE_ALL_CONVERSATIONS" }' });
    return;
  }
  await deleteAllConversations();
  void recordAdminAudit({ actor: 'admin-key', action: 'reset-all' });
  res.json({ success: true });
});

export default router;
