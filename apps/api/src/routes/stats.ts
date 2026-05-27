import { Router, Request, Response } from 'express';
import { getStats } from '../services/stats';
import { requireAdmin } from '../middleware/require-admin';

const router = Router();

router.get('/stats', requireAdmin, async (_req: Request, res: Response) => {
  const stats = await getStats();
  res.json(stats);
});

export default router;
