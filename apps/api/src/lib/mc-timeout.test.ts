import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { withMcTimeout, MANYCHAT_TIMEOUT_MS } from './mc-timeout';

const FALLBACK = { version: 'v2', content: { messages: [] } };

describe('withMcTimeout', () => {
  it('exported constant is 4500 ms', () => {
    assert.equal(MANYCHAT_TIMEOUT_MS, 4_500);
  });

  it('returns work result when work finishes before the deadline', async () => {
    const real = { version: 'v2', content: { messages: [{ type: 'text', text: 'real' }] } };
    const result = await withMcTimeout(
      () => Promise.resolve(real),
      FALLBACK,
      200,
    );
    assert.deepEqual(result, real);
  });

  it('returns fallback when work takes longer than the deadline', async () => {
    const slow = () => new Promise<typeof FALLBACK>((resolve) => setTimeout(() => resolve(FALLBACK), 300));
    const result = await withMcTimeout(slow, FALLBACK, 50);
    assert.deepEqual(result, FALLBACK);
  });

  it('returns fallback when work rejects', async () => {
    const failing = () => Promise.reject(new Error('openai down'));
    const result = await withMcTimeout(failing, FALLBACK, 200);
    assert.deepEqual(result, FALLBACK);
  });

  it('does not double-resolve when work finishes after deadline', async () => {
    const results: unknown[] = [];
    const slow = () => new Promise<string>((resolve) => setTimeout(() => resolve('late'), 150));
    const result = await withMcTimeout(slow, 'fallback', 50);
    results.push(result);
    // Give late work time to resolve to verify no second resolution is observable
    await new Promise((r) => setTimeout(r, 200));
    assert.equal(results.length, 1);
    assert.equal(result, 'fallback');
  });

  it('clears the timer when fast work wins (resolves promptly, not after deadline)', async () => {
    const start = Date.now();
    const result = await withMcTimeout(() => Promise.resolve('fast'), 'fallback', 1_000);
    const elapsed = Date.now() - start;
    assert.equal(result, 'fast');
    // Should not wait near the 1s deadline if work resolved immediately
    assert.ok(elapsed < 200, `expected fast resolve but took ${elapsed}ms`);
  });
});
