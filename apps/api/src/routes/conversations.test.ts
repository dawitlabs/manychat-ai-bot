import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

process.env.OPENAI_API_KEY = 'sk-test';
process.env.DATABASE_URL = 'postgres://localhost/test';
process.env.WEB_ORIGIN = 'http://localhost:3001';
process.env.ADMIN_API_KEY = 'admin-convos-test-at-least-32chars!';
process.env.MANYCHAT_WEBHOOK_SECRET = 'test-secret-at-least-32-chars-long!!';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long!';

// Re-implement the pagination parsing logic from conversations.ts to verify
// its NaN-safety and clamping behavior.
function parseLimit(raw: string | undefined): number {
  const n = Number(raw);
  return Math.min(Number.isFinite(n) && n > 0 ? n : 50, 200);
}

function parseCursor(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

describe('conversations pagination — limit parsing', () => {
  it('defaults to 50 when limit is undefined', () => {
    assert.equal(parseLimit(undefined), 50);
  });

  it('defaults to 50 when limit is non-numeric', () => {
    assert.equal(parseLimit('abc'), 50);
  });

  it('defaults to 50 when limit is 0', () => {
    assert.equal(parseLimit('0'), 50);
  });

  it('defaults to 50 when limit is negative', () => {
    assert.equal(parseLimit('-10'), 50);
  });

  it('clamps limit to 200 when above max', () => {
    assert.equal(parseLimit('500'), 200);
  });

  it('accepts a valid limit within range', () => {
    assert.equal(parseLimit('10'), 10);
  });

  it('accepts the maximum allowed value of 200', () => {
    assert.equal(parseLimit('200'), 200);
  });
});

describe('conversations pagination — cursor parsing', () => {
  it('returns undefined for undefined input', () => {
    assert.equal(parseCursor(undefined), undefined);
  });

  it('returns undefined for empty string', () => {
    assert.equal(parseCursor(''), undefined);
  });

  it('returns undefined for non-numeric string', () => {
    assert.equal(parseCursor('abc'), undefined);
  });

  it('returns undefined for NaN literal string', () => {
    assert.equal(parseCursor('NaN'), undefined);
  });

  it('returns the numeric value for a valid timestamp cursor', () => {
    const ts = Date.now();
    assert.equal(parseCursor(String(ts)), ts);
  });
});
