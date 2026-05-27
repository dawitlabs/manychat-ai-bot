import { Router, Request, Response } from 'express';
import { db } from '../db/client';
import { openaiUsage } from '../db/schema';
import { requireAdmin } from '../middleware/require-admin';

const router = Router();

router.post('/reset-analytics', requireAdmin, async (_req: Request, res: Response) => {
  await db.delete(openaiUsage);
  res.json({ success: true });
});

export default router;
