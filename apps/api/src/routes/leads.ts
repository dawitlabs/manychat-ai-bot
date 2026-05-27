import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { updateConversationStatus } from '../services/conversation-store';
import { requireAdmin } from '../middleware/require-admin';
import { recordAdminAudit } from '../services/admin-audit';

const leadStatusSchema = z.object({
  status: z.enum(['New', 'Engaged', 'Qualified', 'Booked', 'Archived']),
  funnelStep: z.number().int().min(1).max(6).optional(),
});

const router = Router();

router.put('/leads/:user_id/status', requireAdmin, async (req: Request, res: Response) => {
  const parsed = leadStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    const body = process.env.NODE_ENV !== 'production'
      ? { error: 'Invalid status', issues: parsed.error.flatten() }
      : { error: 'Invalid request' };
    res.status(400).json(body);
    return;
  }
  const { user_id } = req.params;
  if (!user_id) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }
  await updateConversationStatus(user_id, parsed.data.status, parsed.data.funnelStep);
  void recordAdminAudit({ actor: 'admin', action: 'lead.status_updated', target: user_id, metadata: parsed.data });
  res.json({ ok: true });
});

export default router;
