import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

process.env.OPENAI_API_KEY = 'sk-test';
process.env.DATABASE_URL = 'postgres://localhost/test';
process.env.WEB_ORIGIN = 'http://localhost:3001';
process.env.ADMIN_API_KEY = 'admin-inbound-test';
process.env.MANYCHAT_WEBHOOK_SECRET = 'test-secret';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long!';

 
const { buildInboundEventKey } = require('./inbound-events') as typeof import('./inbound-events');

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
