/**
 * fetch with retry on transient failures (429 rate limits, 5xx errors).
 *
 * Both free APIs we depend on enforce tight burst limits (Jolpica: 4 req/s
 * unauthenticated; OpenF1 similar), and a page render fires several requests
 * in parallel — so transient 429s are routine, not exceptional. Without a
 * retry, one 429 silently empties a whole page section. Failed responses are
 * never cached by Next.js, so retrying the same URL is safe.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  attempts?: number
): Promise<Response> {
  // During `next build` dozens of pages prerender in parallel, so throttling
  // is expected — wait longer and retry more there. At request time a render
  // is user-facing, so give up sooner and let ISR self-heal on the next pass.
  const isBuild = process.env.NEXT_PHASE === "phase-production-build";
  const maxAttempts = attempts ?? (isBuild ? 6 : 4);
  const maxWaitMs = isBuild ? 30_000 : 8000;

  for (let attempt = 0; ; attempt++) {
    let res: Response | null = null;
    try {
      // Per-attempt timeout: a HUNG upstream (as opposed to an erroring one)
      // would otherwise stall the render until the platform kills the function.
      res = await fetch(url, {
        ...init,
        signal: init.signal ?? AbortSignal.timeout(10_000),
      });
    } catch (err) {
      // Timeouts and connection resets are as transient as a 429 — retry
      // them the same way; rethrow once attempts are exhausted.
      if (attempt >= maxAttempts - 1) throw err;
    }

    if (res) {
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable || attempt >= maxAttempts - 1) return res;
    }

    const retryAfter = Number(res?.headers.get("retry-after"));
    // Exponential backoff (1s, 2s, 4s, ...) with jitter so parallel build
    // workers hitting the same limit don't retry in lockstep and collide again.
    const backoffMs = 1000 * 2 ** attempt + Math.floor(Math.random() * 400);
    const waitMs =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : backoffMs;
    await new Promise((resolve) => setTimeout(resolve, Math.min(waitMs, maxWaitMs)));
  }
}
