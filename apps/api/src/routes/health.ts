import { Router, Request, Response } from 'express';
import { pgClient } from '../db/client';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  try {
    await pgClient`select 1`;
    res.json({ status: 'ok', db: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'ok', db: 'down', timestamp: new Date().toISOString() });
  }
});

export default router;
