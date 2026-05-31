import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';

process.env.OPENAI_API_KEY = 'sk-test';
process.env.DATABASE_URL = 'postgres://localhost/test';
process.env.WEB_ORIGIN = 'http://localhost:3001';
process.env.ADMIN_API_KEY = 'admin-knowledge-route-test-32chars';
process.env.MANYCHAT_WEBHOOK_SECRET = 'test-secret-at-least-32-chars-long!!';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long!';

const knowledgeSchema = z.object({
  title: z.string().min(1).max(160),
  body: z.string().min(1).max(6000),
  category: z.string().min(1).max(80).optional().default('general'),
  tags: z.array(z.string().min(1).max(40)).max(20).optional().default([]),
  source_url: z.string().url().nullable().optional(),
  active: z.boolean().optional().default(true),
}).strict();

describe('knowledge schema validation', () => {
  it('accepts a valid item and defaults category/tags/active', () => {
    const result = knowledgeSchema.safeParse({ title: 'Offer', body: 'Meal plan and workout split.' });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.category, 'general');
      assert.deepEqual(result.data.tags, []);
      assert.equal(result.data.active, true);
    }
  });

  it('rejects unknown fields', () => {
    const result = knowledgeSchema.safeParse({ title: 'Offer', body: 'Text', unknown: true });
    assert.equal(result.success, false);
  });

  it('rejects bad source URLs', () => {
    const result = knowledgeSchema.safeParse({ title: 'Offer', body: 'Text', source_url: 'not-a-url' });
    assert.equal(result.success, false);
  });
});
