import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { fetchWithTimeout, fetchWithRetry } from './http';

// Minimal Response-like object
function makeResponse(status: number): Response {
  return { ok: status >= 200 && status < 300, status } as Response;
}

describe('fetchWithTimeout', () => {
  it('resolves with the response when the request completes in time', async () => {
    const fakeFetch = mock.fn(() => Promise.resolve(makeResponse(200)));
    const original = globalThis.fetch;
    globalThis.fetch = fakeFetch as unknown as typeof fetch;
    try {
      const res = await fetchWithTimeout('https://example.com', { method: 'POST' }, 1_000);
      assert.equal(res.status, 200);
      assert.equal(fakeFetch.mock.calls.length, 1);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('aborts and throws AbortError when the deadline is exceeded', async () => {
    const original = globalThis.fetch;
    // Simulate a slow fetch that never resolves within the deadline
    globalThis.fetch = ((_url: string, init: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          const err = new Error('The operation was aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    }) as unknown as typeof fetch;
    try {
      await assert.rejects(
        () => fetchWithTimeout('https://example.com', {}, 50),
        (err: Error) => err.name === 'AbortError',
      );
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe('fetchWithRetry', () => {
  it('returns immediately on a 2xx response', async () => {
    const original = globalThis.fetch;
    const fakeFetch = mock.fn(() => Promise.resolve(makeResponse(200)));
    globalThis.fetch = fakeFetch as unknown as typeof fetch;
    try {
      const res = await fetchWithRetry('https://example.com', {}, { timeoutMs: 1_000 });
      assert.equal(res.status, 200);
      assert.equal(fakeFetch.mock.calls.length, 1);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('does not retry on a 4xx response', async () => {
    const original = globalThis.fetch;
    const fakeFetch = mock.fn(() => Promise.resolve(makeResponse(404)));
    globalThis.fetch = fakeFetch as unknown as typeof fetch;
    try {
      const res = await fetchWithRetry('https://example.com', {}, { timeoutMs: 1_000, maxRetries: 2 });
      assert.equal(res.status, 404);
      assert.equal(fakeFetch.mock.calls.length, 1);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('retries on 5xx and returns the last response after exhausting retries', async () => {
    const original = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = mock.fn(() => {
      calls++;
      return Promise.resolve(makeResponse(503));
    }) as unknown as typeof fetch;
    try {
      // maxRetries: 1 → 2 total attempts (attempt 0 + 1 retry)
      const res = await fetchWithRetry('https://example.com', {}, { timeoutMs: 1_000, maxRetries: 1 });
      assert.equal(res.status, 503);
      assert.equal(calls, 2);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('retries on 5xx then succeeds when a later attempt returns 2xx', async () => {
    const original = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = mock.fn(() => {
      calls++;
      return Promise.resolve(makeResponse(calls === 1 ? 502 : 200));
    }) as unknown as typeof fetch;
    try {
      const res = await fetchWithRetry('https://example.com', {}, { timeoutMs: 1_000, maxRetries: 2 });
      assert.equal(res.status, 200);
      assert.equal(calls, 2);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('does not retry AbortError (timeout) — re-throws immediately', async () => {
    const original = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = mock.fn(() => {
      calls++;
      const err = new Error('aborted');
      err.name = 'AbortError';
      return Promise.reject(err);
    }) as unknown as typeof fetch;
    try {
      await assert.rejects(
        () => fetchWithRetry('https://example.com', {}, { timeoutMs: 100, maxRetries: 2 }),
        (err: Error) => err.name === 'AbortError',
      );
      assert.equal(calls, 1);
    } finally {
      globalThis.fetch = original;
    }
  });
});
