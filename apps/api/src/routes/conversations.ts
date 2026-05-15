import { Router, Request, Response } from 'express';
import { getAllConversations } from '../services/conversation-store';

const router = Router();

router.get('/conversations', async (_req: Request, res: Response) => {
  const convos = await getAllConversations();
  res.json(convos);
});

export default router;
