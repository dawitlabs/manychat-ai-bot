import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getPost, listPosts, upsertPost, deletePost } from '../services/post-store';
import { extractPostContent } from '../services/openai-client';
import { requireAdmin } from '../middleware/require-admin';
import { recordAdminAudit } from '../services/admin-audit';

const router = Router();

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const postSchema = z.object({
  title: z.string().min(1).max(200),
  hook: z.string().max(500).nullable().optional(),
  key_points: z.string().max(2000).nullable().optional(),
  transcript: z.string().max(20000).nullable().optional(),
  cta: z.string().max(500).nullable().optional(),
  platform: z.enum(['instagram', 'facebook', 'both']).optional().default('both'),
  active: z.boolean().optional().default(true),
});

router.post('/posts/extract', requireAdmin, async (req: Request, res: Response) => {
  const { text } = req.body as { text?: string };
  if (!text || typeof text !== 'string' || text.trim().length < 10) {
    res.status(400).json({ error: 'Provide at least 10 characters of post text to extract from' });
    return;
  }
  try {
    const extracted = await extractPostContent(text.trim());
    res.json(extracted);
  } catch (err) {
    res.status(500).json({ error: 'Extraction failed', detail: (err as Error).message });
  }
});

router.get('/posts', requireAdmin, async (_req: Request, res: Response) => {
  const allPosts = await listPosts();
  res.json(allPosts);
});

router.get('/posts/:slug', requireAdmin, async (req: Request, res: Response) => {
  const { slug } = req.params;
  const post = await getPost(slug);
  if (!post) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(post);
});

router.put('/posts/:slug', requireAdmin, async (req: Request, res: Response) => {
  const { slug } = req.params;
  if (!slugPattern.test(slug)) {
    res.status(400).json({ error: 'Slug must be lowercase kebab-case (e.g. fat-loss-reel)' });
    return;
  }
  const parsed = postSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', issues: parsed.error.flatten() });
    return;
  }
  const post = await upsertPost({ slug, ...parsed.data });
  void recordAdminAudit({ actor: 'admin', action: 'post.upserted', target: slug });
  res.json(post);
});

router.delete('/posts/:slug', requireAdmin, async (req: Request, res: Response) => {
  const { slug } = req.params;
  await deletePost(slug);
  void recordAdminAudit({ actor: 'admin', action: 'post.deleted', target: slug });
  res.json({ ok: true });
});

export default router;
