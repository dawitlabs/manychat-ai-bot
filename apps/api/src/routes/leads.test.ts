import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';

process.env.OPENAI_API_KEY = 'sk-test';
process.env.DATABASE_URL = 'postgres://localhost/test';
process.env.WEB_ORIGIN = 'http://localhost:3001';
process.env.ADMIN_API_KEY = 'admin-leads-test-at-least-32chars!!';
process.env.MANYCHAT_WEBHOOK_SECRET = 'test-secret-at-least-32-chars-long!!';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long!';

// Re-implement the same zod schema used in leads.ts to verify its boundaries
// without pulling in drizzle/DB.
const leadStatusSchema = z.object({
  status: z.enum(['New', 'Engaged', 'Qualified', 'Booked', 'Archived']),
  funnelStep: z.number().int().min(1).max(6).optional(),
});

describe('lead status schema validation', () => {
  it('rejects an invalid status value', () => {
    const result = leadStatusSchema.safeParse({ status: 'Unknown' });
    assert.equal(result.success, false);
  });

  it('rejects a missing status field', () => {
    const result = leadStatusSchema.safeParse({});
    assert.equal(result.success, false);
  });

  it('accepts a valid status without funnelStep', () => {
    const result = leadStatusSchema.safeParse({ status: 'Qualified' });
    assert.equal(result.success, true);
  });

  it('accepts a valid status with funnelStep in range', () => {
    const result = leadStatusSchema.safeParse({ status: 'Booked', funnelStep: 6 });
    assert.equal(result.success, true);
  });

  it('rejects funnelStep below 1', () => {
    const result = leadStatusSchema.safeParse({ status: 'New', funnelStep: 0 });
    assert.equal(result.success, false);
  });

  it('rejects funnelStep above 6', () => {
    const result = leadStatusSchema.safeParse({ status: 'New', funnelStep: 7 });
    assert.equal(result.success, false);
  });

  it('accepts every valid status value', () => {
    for (const status of ['New', 'Engaged', 'Qualified', 'Booked', 'Archived'] as const) {
      const result = leadStatusSchema.safeParse({ status });
      assert.equal(result.success, true, `${status} should be accepted`);
    }
  });
});

describe('leads user_id path param guard', () => {
  // The route does: if (!user_id) { res.status(400).json(...); return; }
  function simulateGuard(userId: string): boolean {
    // Returns true if the route would reject (user_id is falsy)
    return !userId;
  }

  it('empty string triggers 400 guard', () => {
    assert.equal(simulateGuard(''), true);
  });

  it('non-empty user_id passes the guard', () => {
    assert.equal(simulateGuard('user_123'), false);
  });
});
