import { describe, expect, it, vi } from "vitest";
import { createIdempotencyStore, isIdempotencyKey } from "./idempotency";

describe("createIdempotencyStore", () => {
  it("runs once per key within the TTL and returns the first result", async () => {
    const once = createIdempotencyStore<string>({ ttlMs: 1_000 });
    const run = vi.fn(async () => "FLT-261010-0001");
    const [a, b] = await Promise.all([once("k", run, 0), once("k", run, 10)]);
    expect([a, b]).toEqual(["FLT-261010-0001", "FLT-261010-0001"]);
    expect(run).toHaveBeenCalledTimes(1);
    await once("k", run, 2_000);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("lets a failed attempt be retried with the same key", async () => {
    const once = createIdempotencyStore<string>({ ttlMs: 1_000 });
    await expect(once("k", async () => Promise.reject(new Error("down")), 0)).rejects.toThrow(
      "down",
    );
    await Promise.resolve();
    await expect(once("k", async () => "ok", 1)).resolves.toBe("ok");
  });
});

describe("createIdempotencyStore keep (#61)", () => {
  it("forgets results that keep() rejects, so the same key can run again", async () => {
    const once = createIdempotencyStore<{ ok: boolean }>({ ttlMs: 1_000, keep: (r) => r.ok });
    const refused = vi.fn(async () => ({ ok: false }));
    await expect(once("k", refused, 0)).resolves.toEqual({ ok: false });
    await Promise.resolve();
    const placed = vi.fn(async () => ({ ok: true }));
    await expect(once("k", placed, 1)).resolves.toEqual({ ok: true });
    await expect(once("k", placed, 2)).resolves.toEqual({ ok: true });
    expect(placed).toHaveBeenCalledTimes(1);
  });
});

describe("isIdempotencyKey", () => {
  it("accepts UUIDs only", () => {
    expect(isIdempotencyKey("3f2a7c1e-9b4d-4e6f-8a1b-2c3d4e5f6a7b")).toBe(true);
    expect(isIdempotencyKey("abc")).toBe(false);
  });
});
