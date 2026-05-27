export const MANYCHAT_TIMEOUT_MS = 4_500;

/**
 * Races `work` against a deadline. If the deadline fires first, `fallback` is
 * returned and `work` continues running in the background (fire-and-forget).
 * If `work` rejects, `fallback` is returned immediately.
 */
export async function withMcTimeout<T>(work: () => Promise<T>, fallback: T, ms = MANYCHAT_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) { settled = true; resolve(fallback); }
    }, ms);

    work().then(
      (v) => { if (!settled) { settled = true; clearTimeout(timer); resolve(v); } },
      () => { if (!settled) { settled = true; clearTimeout(timer); resolve(fallback); } },
    );
  });
}
