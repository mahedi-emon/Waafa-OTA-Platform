/**
 * Idempotency for form submits (CLAUDE.md "Always"): the same key within the TTL returns the first result instead
 * of creating a second lead, so a double tap or a retried request makes one lead. In-memory in Phase A; Phase B
 * keeps keys in Redis next to the API.
 */
export function createIdempotencyStore<T>({
  ttlMs,
  maxKeys = 2_000,
}: {
  ttlMs: number;
  maxKeys?: number;
}) {
  const entries = new Map<string, { expiresAt: number; value: Promise<T> }>();

  return function once(key: string, run: () => Promise<T>, now: number = Date.now()): Promise<T> {
    const existing = entries.get(key);
    if (existing && existing.expiresAt > now) return existing.value;
    if (entries.size >= maxKeys) {
      for (const [k, entry] of entries) if (entry.expiresAt <= now) entries.delete(k);
      if (entries.size >= maxKeys) entries.delete(entries.keys().next().value as string);
    }
    const value = run();
    entries.set(key, { expiresAt: now + ttlMs, value });
    // A failed attempt may be retried with the same key.
    value.catch(() => entries.delete(key));
    return value;
  };
}

/** Idempotency keys are client-made UUIDs (crypto.randomUUID). */
export function isIdempotencyKey(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}
