import { Router, Request, Response } from 'express';
import { getAllConversations } from '../services/conversation-store';
import { requireApiKey } from '../middleware/api-key';

const router = Router();

router.get('/conversations', requireApiKey, async (_req: Request, res: Response) => {
  const convos = await getAllConversations();
  res.json(convos);
});

export default router;
