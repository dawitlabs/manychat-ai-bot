import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request, Response, NextFunction } from 'express';

process.env.OPENAI_API_KEY = 'sk-test';
process.env.DATABASE_URL = 'postgres://localhost/test';
process.env.WEB_ORIGIN = 'http://localhost:3001';
process.env.ADMIN_API_KEY = 'admin-key-test';
process.env.MANYCHAT_WEBHOOK_SECRET = 'test-secret';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long!';

 
const { requireAdmin } = require('../middleware/require-admin') as typeof import('../middleware/require-admin');

function makeReq(adminKey?: string): Request {
  const headers: Record<string, string> = adminKey ? { 'x-admin-key': adminKey } : {};
  return {
    headers,
    header(name: string) { return headers[name.toLowerCase()]; },
  } as unknown as Request;
}

function capture(): { res: Response; code: () => number | undefined } {
  let code: number | undefined;
  const res = {
    status(n: number) {
      code = n;
      return { json(_b: unknown) {} };
    },
    json(_b: unknown) {},
  } as unknown as Response;
  return { res, code: () => code };
}

describe('requireAdmin middleware', () => {
  it('returns 401 without x-admin-key', () => {
    const { res, code } = capture();
    let called = false;
    const next: NextFunction = () => { called = true; };
    requireAdmin(makeReq(), res, next);
    assert.equal(code(), 401);
    assert.equal(called, false);
  });

  it('calls next() with the correct admin key', () => {
    const { res, code } = capture();
    let called = false;
    const next: NextFunction = () => { called = true; };
    requireAdmin(makeReq('admin-key-test'), res, next);
    assert.equal(called, true);
    assert.equal(code(), undefined);
  });

  it('returns 401 with a wrong key', () => {
    const { res, code } = capture();
    let called = false;
    const next: NextFunction = () => { called = true; };
    requireAdmin(makeReq('wrong-key'), res, next);
    assert.equal(code(), 401);
    assert.equal(called, false);
  });
});
