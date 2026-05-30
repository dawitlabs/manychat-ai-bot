import { outboundTimeouts } from './metrics';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function retryDelay(attempt: number): number {
  // Exponential backoff with jitter, capped at 10s
  const base = 500 * Math.pow(2, attempt);
  return Math.min(base + Math.random() * 300, 10_000);
}

/**
 * fetch() with an AbortController deadline. Throws `AbortError` on timeout.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * fetchWithTimeout + retry on transient server errors (5xx, network failure).
 * Does NOT retry 4xx — those are caller errors and will never succeed.
 * Increments outboundTimeouts metric on AbortError.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: { timeoutMs: number; maxRetries?: number; target?: string } = { timeoutMs: 8_000 },
): Promise<Response> {
  const max = options.maxRetries ?? 2;
  const target = options.target ?? 'unknown';
  let lastErr: unknown;

  for (let attempt = 0; attempt <= max; attempt++) {
    try {
      const res = await fetchWithTimeout(url, init, options.timeoutMs);
      if (res.status < 500 || attempt === max) return res;
      // Transient 5xx — log and retry
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
      // AbortError means timeout — retrying is pointless
      if ((err as Error).name === 'AbortError') {
        outboundTimeouts.inc({ target });
        throw err;
      }
      if (attempt === max) throw err;
    }

    const delay = retryDelay(attempt);
    await sleep(delay);
  }

  throw lastErr;
}
