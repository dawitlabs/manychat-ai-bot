import { Router, Request, Response } from 'express';
import { updateConversationStatus } from '../services/conversation-store';

const router = Router();

router.put('/leads/:user_id/status', async (req: Request, res: Response) => {
  const { user_id } = req.params;
  const { status, funnelStep } = req.body as { status?: string; funnelStep?: number };
  if (!status) {
    res.status(400).json({ error: 'status required' });
    return;
  }
  await updateConversationStatus(user_id, status, funnelStep);
  res.json({ ok: true });
});

export default router;
