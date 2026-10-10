/**
 * Fixed-window rate limiter in process memory. Enough for one API instance at launch; with several replicas the
 * limits move to Redis (NFR-SEC). Each key may make `limit` requests per `windowMs`.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return function allow(key: string, now: number = Date.now()): boolean {
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      if (hits.size > 10_000) {
        for (const [k, value] of hits) if (value.resetAt <= now) hits.delete(k);
      }
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    entry.count += 1;
    return entry.count <= limit;
  };
}
