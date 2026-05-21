import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { deleteConversation, deleteAllConversations } from '../services/conversation-store';

const router = Router();

const bodySchema = z.object({ user_id: z.string().min(1) });

router.post('/reset', async (req: Request, res: Response) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'user_id required' });
    return;
  }
  await deleteConversation(parsed.data.user_id);
  res.json({ success: true });
});

router.post('/reset-all', async (_req: Request, res: Response) => {
  await deleteAllConversations();
  res.json({ success: true });
});

export default router;
