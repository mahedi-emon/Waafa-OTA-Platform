/**
 * Fixed-window rate limiter kept in server memory (Phase A; Phase B moves limits to Redis in the API). Each key
 * (usually an IP plus a route) may make `limit` requests per `windowMs`.
 */
export function createRateLimiter({
  limit,
  windowMs,
  maxKeys = 5_000,
}: {
  limit: number;
  windowMs: number;
  maxKeys?: number;
}) {
  // End-to-end runs send many forms from one address; the test server raises limits with RATE_LIMIT_FACTOR.
  const factor = Math.max(1, Number(process.env.RATE_LIMIT_FACTOR) || 1);
  const allowed = limit * factor;
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function allow(key: string, now: number = Date.now()): boolean {
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      if (hits.size >= maxKeys) {
        for (const [k, value] of hits) if (value.resetAt <= now) hits.delete(k);
        if (hits.size >= maxKeys) hits.delete(hits.keys().next().value as string);
      }
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    entry.count += 1;
    return entry.count <= allowed;
  };
}

/** The client address as reported by the proxy in front of the app, or "unknown". */
export function clientKey(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown"
  );
}
