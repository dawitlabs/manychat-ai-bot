import { Router, Request, Response } from 'express';
import { getStats } from '../services/stats';

const router = Router();

router.get('/stats', async (_req: Request, res: Response) => {
  const stats = await getStats();
  res.json(stats);
});

export default router;
