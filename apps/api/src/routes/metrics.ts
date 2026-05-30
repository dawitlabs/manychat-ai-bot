import { Router, Request, Response } from 'express';
import { registry } from '../lib/metrics';

const router = Router();

// Prometheus scrape endpoint. No auth — metrics contain no PII.
// Restrict network-level access in production (e.g. Render private networking).
router.get('/metrics', async (_req: Request, res: Response) => {
  const output = await registry.metrics();
  res.set('Content-Type', registry.contentType);
  res.end(output);
});

export default router;
