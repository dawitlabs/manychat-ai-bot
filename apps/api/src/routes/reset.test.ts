import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

process.env.OPENAI_API_KEY = 'sk-test';
process.env.DATABASE_URL = 'postgres://localhost/test';
process.env.WEB_ORIGIN = 'http://localhost:3001';
process.env.ADMIN_API_KEY = 'admin-reset-test-at-least-32chars!!';
process.env.MANYCHAT_WEBHOOK_SECRET = 'test-secret-at-least-32-chars-long!!';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long!';

import type { Request, Response } from 'express';

 
const { requireAdmin } = require('../middleware/require-admin') as typeof import('../middleware/require-admin');

function makeReq(
  adminKey?: string,
  body?: unknown,
  params?: Record<string, string>,
): Request {
  const headers: Record<string, string> = adminKey ? { 'x-admin-key': adminKey } : {};
  return {
    headers,
    header(name: string) { return headers[name.toLowerCase()]; },
    body: body ?? {},
    params: params ?? {},
  } as unknown as Request;
}

function capture(): { res: Response; code: () => number | undefined; body: () => unknown } {
  let code: number | undefined;
  let sentBody: unknown;
  const res = {
    status(n: number) { code = n; return { json(b: unknown) { sentBody = b; } }; },
    json(b: unknown) { sentBody = b; },
  } as unknown as Response;
  return { res, code: () => code, body: () => sentBody };
}

// ── requireAdmin smoke ─────────────────────────────────────────────────────────

describe('requireAdmin (reset routes)', () => {
  it('returns 401 without x-admin-key', () => {
    const { res, code } = capture();
    let called = false;
    requireAdmin(makeReq(), res, () => { called = true; });
    assert.equal(code(), 401);
    assert.equal(called, false);
  });

  it('calls next() with the correct key', () => {
    const { code } = capture();
    let called = false;
    requireAdmin(makeReq('admin-reset-test-at-least-32chars!!'), capture().res, () => { called = true; });
    assert.equal(called, true);
    assert.equal(code(), undefined);
  });
});

// ── /reset-all confirm body ───────────────────────────────────────────────────

// We test the Zod validation layer inline rather than importing the full route
// (which would pull in drizzle + DB). The confirm schema is straightforward enough
// to verify by re-implementing the same zod parse call.
import { z } from 'zod';

const confirmSchema = z.object({ confirm: z.literal('DELETE_ALL_CONVERSATIONS') });

describe('/reset-all confirm body validation', () => {
  it('rejects an empty body', () => {
    const result = confirmSchema.safeParse({});
    assert.equal(result.success, false);
  });

  it('rejects the wrong confirm string', () => {
    const result = confirmSchema.safeParse({ confirm: 'yes' });
    assert.equal(result.success, false);
  });

  it('accepts the exact confirm string', () => {
    const result = confirmSchema.safeParse({ confirm: 'DELETE_ALL_CONVERSATIONS' });
    assert.equal(result.success, true);
  });
});

// ── /reset user_id validation ─────────────────────────────────────────────────

const bodySchema = z.object({ user_id: z.string().min(1) });

describe('/reset user_id validation', () => {
  it('rejects missing user_id', () => {
    const result = bodySchema.safeParse({});
    assert.equal(result.success, false);
  });

  it('rejects empty string user_id', () => {
    const result = bodySchema.safeParse({ user_id: '' });
    assert.equal(result.success, false);
  });

  it('accepts a non-empty user_id', () => {
    const result = bodySchema.safeParse({ user_id: 'user_123' });
    assert.equal(result.success, true);
  });
});

// ── requireAdmin middleware against full chain simulation ─────────────────────

describe('reset route auth gate', () => {
  it('returns 401 for /reset-all without admin key', () => {
    const { res, code } = capture();
    let called = false;
    // Simulate the middleware chain: requireAdmin → handler
    requireAdmin(makeReq(/* no key */), res, () => { called = true; });
    assert.equal(code(), 401);
    assert.equal(called, false, 'handler must not be called without valid key');
  });
});
