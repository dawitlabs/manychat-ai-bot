import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getSettingJson, setSettingJson } from '../services/settings-store';
import { requireAdmin } from '../middleware/require-admin';
import { recordAdminAudit } from '../services/admin-audit';

const templateSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(2000),
  tags: z.array(z.string().max(30)).max(10).default([]),
});

const templatesSchema = z.object({
  openers: z.array(templateSchema).max(50),
  qualifiers: z.array(templateSchema).max(50),
  objections: z.array(templateSchema).max(50),
  closers: z.array(templateSchema).max(50),
});

export type ApiTemplates = z.infer<typeof templatesSchema>;

export const DEFAULT_TEMPLATES: ApiTemplates = {
  openers: [
    { id: 'op-1', title: 'Comment DM Opener', body: "Hey [name]! You just unlocked Kyle's free guide 💪 Quick question: what's the #1 thing you want to change right now?", tags: ['comment', 'trigger', 'high-convert'] },
    { id: 'op-2', title: 'Cold DM Opener', body: "Hey [name], saw your profile and wanted to reach out. Are you still working on [goal]?", tags: ['cold', 'outreach'] },
    { id: 'op-3', title: 'Re-engagement', body: "Just bumping this, any progress with the weights man?", tags: ['follow-up', 're-engage'] },
    { id: 'op-4', title: 'Post-comment', body: "[name] — that's exactly the kind of progress I help guys lock in. Reply GO to chat with me!", tags: ['comment', 'social'] },
    { id: 'op-5', title: 'Follow-up 48h', body: "Hey man, still there? Wanted to check in on how things are going.", tags: ['follow-up', '48h'] },
  ],
  qualifiers: [
    { id: 'qu-1', title: 'Progress Check', body: "How's the progress with that been so far?", tags: ['check-in', 'step-2'] },
    { id: 'qu-2', title: 'Nutrition Check', body: "Besides the physical side of things, how's your nutrition?", tags: ['nutrition', 'step-2'] },
    { id: 'qu-3', title: 'Biggest Struggle', body: "I'm curious, what would you say has been the biggest struggle you're facing currently?", tags: ['pain-point', 'step-3'] },
    { id: 'qu-4', title: 'Ready to Commit', body: "Are you just in a researching phase right now, or ready to make some serious progress?", tags: ['commitment', 'step-4'] },
  ],
  objections: [
    { id: 'ob-1', title: 'Price Question', body: "We can go over the investment for sure man. But first I gotta know if you're just looking around or genuinely ready to make a change.", tags: ['price', 'deflect'] },
    { id: 'ob-2', title: 'What Do You Offer?', body: "I provide a complete transformation system with custom nutrition and done-for-you workouts.", tags: ['value', 'offer'] },
    { id: 'ob-3', title: 'Is the Call Free?', body: "Yeah for sure man, the conversation won't cost you a dime.", tags: ['free', 'call'] },
    { id: 'ob-4', title: 'Not Sure Yet', body: "No pressure at all man. Just want to make sure I can actually help before we waste each other's time.", tags: ['soft', 'nurture'] },
  ],
  closers: [
    { id: 'cl-1', title: 'Pivot to Call', body: "I have a few ideas based on what you shared, but it'd take 10 paragraphs to type out here.", tags: ['pivot', 'call'] },
    { id: 'cl-2', title: 'Send Booking Link', body: "Sounds good man. Here's the booking link:\nhttps://calendly.com/kyle-briere-largedumbbells/30", tags: ['calendly', 'close'] },
    { id: 'cl-3', title: 'Urgency Close', body: "My calendar has limited space so make sure you book a time now.", tags: ['urgency', 'scarcity'] },
  ],
};

const router = Router();

router.get('/templates', requireAdmin, async (_req: Request, res: Response) => {
  const templates = await getSettingJson<ApiTemplates>('templates', DEFAULT_TEMPLATES);
  res.json(templates);
});

router.put('/templates', requireAdmin, async (req: Request, res: Response) => {
  const parsed = templatesSchema.safeParse(req.body);
  if (!parsed.success) {
    const body = process.env.NODE_ENV !== 'production'
      ? { error: 'Invalid templates', issues: parsed.error.flatten() }
      : { error: 'Invalid request' };
    res.status(400).json(body);
    return;
  }
  await setSettingJson('templates', parsed.data);
  void recordAdminAudit({ actor: 'admin', action: 'templates.updated' });
  res.json({ ok: true });
});

export default router;
