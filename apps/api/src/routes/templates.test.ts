import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';

process.env.OPENAI_API_KEY = 'sk-test';
process.env.DATABASE_URL = 'postgres://localhost/test';
process.env.WEB_ORIGIN = 'http://localhost:3001';
process.env.ADMIN_API_KEY = 'admin-templates-test';
process.env.MANYCHAT_WEBHOOK_SECRET = 'test-secret';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long!';

// Re-implement the templates zod schema inline (avoids DB import from routes/templates.ts)
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

const validTemplate = { id: 't-1', title: 'Test', body: 'Hello [name]', tags: ['test'] };

const validBody = {
  openers: [validTemplate],
  qualifiers: [validTemplate],
  objections: [validTemplate],
  closers: [validTemplate],
};

describe('templates schema validation', () => {
  it('accepts a valid body with all four categories', () => {
    const result = templatesSchema.safeParse(validBody);
    assert.equal(result.success, true);
  });

  it('accepts empty arrays per category', () => {
    const result = templatesSchema.safeParse({ openers: [], qualifiers: [], objections: [], closers: [] });
    assert.equal(result.success, true);
  });

  it('rejects missing a category', () => {
    const { closers: _, ...without } = validBody;
    const result = templatesSchema.safeParse(without);
    assert.equal(result.success, false);
  });

  it('rejects a template with missing id', () => {
    const { id: _, ...noId } = validTemplate;
    const result = templatesSchema.safeParse({ ...validBody, openers: [noId] });
    assert.equal(result.success, false);
  });

  it('rejects a template with empty title', () => {
    const result = templatesSchema.safeParse({ ...validBody, openers: [{ ...validTemplate, title: '' }] });
    assert.equal(result.success, false);
  });

  it('rejects a template with body exceeding 2000 chars', () => {
    const result = templatesSchema.safeParse({ ...validBody, openers: [{ ...validTemplate, body: 'x'.repeat(2001) }] });
    assert.equal(result.success, false);
  });

  it('rejects a category array exceeding 50 templates', () => {
    const tooMany = Array.from({ length: 51 }, (_, i) => ({ ...validTemplate, id: `t-${i}` }));
    const result = templatesSchema.safeParse({ ...validBody, openers: tooMany });
    assert.equal(result.success, false);
  });

  it('rejects a tag array exceeding 10 tags', () => {
    const tooManyTags = Array.from({ length: 11 }, (_, i) => `tag-${i}`);
    const result = templatesSchema.safeParse({ ...validBody, openers: [{ ...validTemplate, tags: tooManyTags }] });
    assert.equal(result.success, false);
  });

  it('defaults tags to empty array when omitted', () => {
    const { tags: _, ...noTags } = validTemplate;
    const result = templatesSchema.safeParse({ ...validBody, openers: [noTags] });
    assert.equal(result.success, true);
    if (result.success) {
      assert.deepEqual(result.data.openers[0].tags, []);
    }
  });

  it('accepts a tag string of exactly 30 chars', () => {
    const result = templatesSchema.safeParse({ ...validBody, openers: [{ ...validTemplate, tags: ['a'.repeat(30)] }] });
    assert.equal(result.success, true);
  });

  it('rejects a tag string exceeding 30 chars', () => {
    const result = templatesSchema.safeParse({ ...validBody, openers: [{ ...validTemplate, tags: ['a'.repeat(31)] }] });
    assert.equal(result.success, false);
  });
});
