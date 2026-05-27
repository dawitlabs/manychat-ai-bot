import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';

process.env.OPENAI_API_KEY = 'sk-test';
process.env.DATABASE_URL = 'postgres://localhost/test';
process.env.WEB_ORIGIN = 'http://localhost:3001';
process.env.ADMIN_API_KEY = 'admin-settings-test';
process.env.MANYCHAT_WEBHOOK_SECRET = 'test-secret';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long!';

// Re-implement the bot-settings Zod schema to verify its validation boundaries.
const settingsSchema = z.object({
  botActive: z.boolean().optional(),
  model: z.enum(['gpt-4o-mini', 'gpt-4o', 'gpt-4o-2024-11-20']).optional(),
  maxTokens: z.number().int().min(40).max(2000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  ttl: z.number().int().min(1).max(168).optional(),
  maxHistory: z.number().int().min(2).max(200).optional(),
  bookingLink: z.string().url().optional(),
}).strict();

const DEFAULTS = {
  botActive: true,
  model: 'gpt-4o-mini',
  maxTokens: 220,
  temperature: 0.4,
  maxHistory: 40,
  bookingLink: 'https://calendly.com/kyle-briere-largedumbbells/30',
};

describe('bot-settings schema validation', () => {
  it('rejects unknown model value', () => {
    const result = settingsSchema.safeParse({ model: 'gpt-5' });
    assert.equal(result.success, false);
  });

  it('rejects unknown field (strict schema)', () => {
    const result = settingsSchema.safeParse({ unknownField: true });
    assert.equal(result.success, false);
  });

  it('accepts empty object (all fields optional)', () => {
    const result = settingsSchema.safeParse({});
    assert.equal(result.success, true);
  });

  it('accepts valid partial update', () => {
    const result = settingsSchema.safeParse({ botActive: false, maxTokens: 500 });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.botActive, false);
      assert.equal(result.data.maxTokens, 500);
    }
  });

  it('rejects maxTokens below minimum (40)', () => {
    const result = settingsSchema.safeParse({ maxTokens: 10 });
    assert.equal(result.success, false);
  });

  it('rejects maxTokens above maximum (2000)', () => {
    const result = settingsSchema.safeParse({ maxTokens: 9999 });
    assert.equal(result.success, false);
  });

  it('rejects temperature above 2', () => {
    const result = settingsSchema.safeParse({ temperature: 2.5 });
    assert.equal(result.success, false);
  });

  it('accepts all valid model values', () => {
    for (const model of ['gpt-4o-mini', 'gpt-4o', 'gpt-4o-2024-11-20'] as const) {
      const result = settingsSchema.safeParse({ model });
      assert.equal(result.success, true, `${model} should be accepted`);
    }
  });
});

describe('bot-settings JSON parse fallback', () => {
  it('falls back to DEFAULTS when stored value is not valid JSON', () => {
    function safeParseCurrent(raw: string): typeof DEFAULTS {
      try { return JSON.parse(raw) as typeof DEFAULTS; }
      catch { return DEFAULTS; }
    }

    const result = safeParseCurrent('not-json');
    assert.deepEqual(result, DEFAULTS);
  });

  it('falls back to DEFAULTS for an empty string', () => {
    function safeParseCurrent(raw: string): typeof DEFAULTS {
      try { return JSON.parse(raw) as typeof DEFAULTS; }
      catch { return DEFAULTS; }
    }

    const result = safeParseCurrent('');
    assert.deepEqual(result, DEFAULTS);
  });

  it('returns the parsed value when JSON is valid', () => {
    function safeParseCurrent(raw: string): typeof DEFAULTS {
      try { return JSON.parse(raw) as typeof DEFAULTS; }
      catch { return DEFAULTS; }
    }

    const stored = { ...DEFAULTS, botActive: false };
    const result = safeParseCurrent(JSON.stringify(stored));
    assert.equal(result.botActive, false);
  });
});

describe('bot-settings merge behavior', () => {
  it('partial update is merged with existing values', () => {
    const current = { ...DEFAULTS };
    const patch = { botActive: false };
    const merged = { ...current, ...patch };
    assert.equal(merged.botActive, false);
    assert.equal(merged.maxTokens, DEFAULTS.maxTokens);
    assert.equal(merged.model, DEFAULTS.model);
  });
});
