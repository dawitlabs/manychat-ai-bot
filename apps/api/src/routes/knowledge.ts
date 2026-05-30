import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../middleware/require-admin';
import { recordAdminAudit } from '../services/admin-audit';
import { deleteKnowledgeItem, listKnowledgeItems, upsertKnowledgeItem } from '../services/knowledge-store';

const router = Router();

const knowledgeSchema = z.object({
  title: z.string().min(1).max(160),
  body: z.string().min(1).max(6000),
  category: z.string().min(1).max(80).optional().default('general'),
  tags: z.array(z.string().min(1).max(40)).max(20).optional().default([]),
  source_url: z.string().url().nullable().optional(),
  active: z.boolean().optional().default(true),
}).strict();

router.get('/knowledge', requireAdmin, async (req: Request, res: Response) => {
  const q = typeof req.query.q === 'string' ? req.query.q : undefined;
  const category = typeof req.query.category === 'string' && req.query.category !== 'all'
    ? req.query.category
    : undefined;
  const active = req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined;
  const items = await listKnowledgeItems({ q, category, active });
  res.json(items);
});

router.post('/knowledge', requireAdmin, async (req: Request, res: Response) => {
  const parsed = knowledgeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid knowledge item', issues: parsed.error.flatten() });
    return;
  }

  const item = await upsertKnowledgeItem(parsed.data);
  void recordAdminAudit({ actor: 'admin', action: 'knowledge.created', target: String(item.id) });
  res.status(201).json(item);
});

router.put('/knowledge/:id', requireAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid knowledge id' });
    return;
  }

  const parsed = knowledgeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid knowledge item', issues: parsed.error.flatten() });
    return;
  }

  const item = await upsertKnowledgeItem({ id, ...parsed.data });
  void recordAdminAudit({ actor: 'admin', action: 'knowledge.updated', target: String(id) });
  res.json(item);
});

router.delete('/knowledge/:id', requireAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid knowledge id' });
    return;
  }

  await deleteKnowledgeItem(id);
  void recordAdminAudit({ actor: 'admin', action: 'knowledge.deleted', target: String(id) });
  res.json({ ok: true });
});

export default router;
