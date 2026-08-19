type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = { allowed: boolean; retryAfterMs: number };

/**
 * Fixed-window limiter.
 *
 * LIMITATION: this is in-process, and serverless functions do not share memory,
 * so a determined bot spread across instances can exceed the nominal limit. It
 * is a cheap first line that stops naive floods; Turnstile is the real control.
 * Move to a shared store (Turso table or Upstash) if abuse becomes material.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}
