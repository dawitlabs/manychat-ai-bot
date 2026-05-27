import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request, Response, NextFunction } from 'express';

const SECRET = 'test-secret-vm';

process.env.MANYCHAT_WEBHOOK_SECRET = SECRET;
process.env.OPENAI_API_KEY = 'sk-test';
process.env.DATABASE_URL = 'postgres://localhost/test';
process.env.WEB_ORIGIN = 'http://localhost:3001';
process.env.ADMIN_API_KEY = 'admin-test';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long!';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { verifyManychat } = require('./verify-manychat') as typeof import('./verify-manychat');

function makeReq(secret?: string): Request {
  return { query: secret !== undefined ? { secret } : {}, headers: {} } as unknown as Request;
}

function capture(): { res: Response; code: () => number | undefined } {
  let code: number | undefined;
  const res = {
    status(n: number) { code = n; return { json(_b: unknown) {} }; },
  } as unknown as Response;
  return { res, code: () => code };
}

describe('verifyManychat', () => {
  it('returns 401 when secret query param is missing', () => {
    const { res, code } = capture();
    let called = false;
    verifyManychat(makeReq(), res, () => { called = true; });
    assert.equal(code(), 401);
    assert.equal(called, false);
  });

  it('returns 401 for a wrong secret', () => {
    const { res, code } = capture();
    let called = false;
    verifyManychat(makeReq('wrong-secret'), res, () => { called = true; });
    assert.equal(code(), 401);
    assert.equal(called, false);
  });

  it('calls next() for the correct secret', () => {
    const { res, code } = capture();
    let called = false;
    verifyManychat(makeReq(SECRET), res, () => { called = true; });
    assert.equal(called, true);
    assert.equal(code(), undefined);
  });

  it('returns 401 for an empty secret', () => {
    const { res, code } = capture();
    let called = false;
    verifyManychat(makeReq(''), res, () => { called = true; });
    assert.equal(code(), 401);
    assert.equal(called, false);
  });
});
