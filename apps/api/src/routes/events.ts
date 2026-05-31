import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/require-admin';
import { getRecentEvents } from '../services/event-log';

const router = Router();

router.get('/events', requireAdmin, async (req: Request, res: Response) => {
  const rawLimit = Number(req.query.limit);
  const limit = Math.min(Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 50, 200);
  const events = await getRecentEvents({ limit });
  res.json(events);
});

export default router;
