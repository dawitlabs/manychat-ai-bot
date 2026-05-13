import { Router, Request, Response } from 'express';
import { getStats } from '../services/stats';
import { requireApiKey } from '../middleware/api-key';

const router = Router();

router.get('/stats', requireApiKey, async (_req: Request, res: Response) => {
  const stats = await getStats();
  res.json(stats);
});

export default router;
