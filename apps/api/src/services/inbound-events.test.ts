import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

process.env.OPENAI_API_KEY = 'sk-test';
process.env.DATABASE_URL = 'postgres://localhost/test';
process.env.WEB_ORIGIN = 'http://localhost:3001';
process.env.ADMIN_API_KEY = 'admin-inbound-test-32-chars-long!!';
process.env.MANYCHAT_WEBHOOK_SECRET = 'test-secret-at-least-32-chars-long!!';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long!';

 
const { buildInboundEventKey, isClaimStale, STALE_CLAIM_MS } = require('./inbound-events') as typeof import('./inbound-events');

describe('buildInboundEventKey', () => {
  it('uses the first stable inbound event id', () => {
    assert.equal(
      buildInboundEventKey({ platform: 'instagram', userId: 'u1', messageId: 'm1', eventId: 'e1' }),
      'instagram:u1:m1',
    );
  });

  it('falls back to other ManyChat id fields', () => {
    assert.equal(
      buildInboundEventKey({ platform: 'facebook', userId: 'u2', manychatEventId: 'mc-9' }),
      'facebook:u2:mc-9',
    );
  });

  it('returns null when no stable event id and no message', () => {
    assert.equal(buildInboundEventKey({ platform: 'instagram', userId: 'u3' }), null);
  });

  it('uses content-hash fallback when no stable id but message is provided', () => {
    const key = buildInboundEventKey({ platform: 'instagram', userId: 'u4', message: 'hello', timestamp: 0 });
    assert.ok(key?.startsWith('instagram:u4:c:'), `expected content-hash key, got ${key}`);
    // Same message + same bucket → same key (deterministic)
    const key2 = buildInboundEventKey({ platform: 'instagram', userId: 'u4', message: 'hello', timestamp: 60_000 });
    assert.equal(key, key2);
    // Different 2-minute bucket → different key
    const key3 = buildInboundEventKey({ platform: 'instagram', userId: 'u4', message: 'hello', timestamp: 120_000 });
    assert.notEqual(key, key3);
  });
});

describe('isClaimStale', () => {
  const now = 1_000_000_000_000;

  it('treats a fresh claim as not stale', () => {
    assert.equal(isClaimStale(new Date(now - 1_000), now), false);
  });

  it('treats a claim older than the stale window as reclaimable', () => {
    assert.equal(isClaimStale(new Date(now - STALE_CLAIM_MS - 1), now), true);
  });

  it('is stale exactly at the boundary', () => {
    assert.equal(isClaimStale(new Date(now - STALE_CLAIM_MS), now), true);
  });

  it('respects a custom stale window', () => {
    assert.equal(isClaimStale(new Date(now - 5_000), now, 10_000), false);
    assert.equal(isClaimStale(new Date(now - 15_000), now, 10_000), true);
  });
});
