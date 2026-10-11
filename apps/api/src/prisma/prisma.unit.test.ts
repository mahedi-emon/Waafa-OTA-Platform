import { describe, expect, it, vi } from "vitest";
import { TRANSACTION_OPTIONS, warmUp } from "./prisma.service";

describe("cold start (issue 119)", () => {
  it("gives interactive transactions room for a cold start", () => {
    expect(TRANSACTION_OPTIONS.timeout).toBeGreaterThanOrEqual(15_000);
    expect(TRANSACTION_OPTIONS.maxWait).toBeGreaterThanOrEqual(5_000);
  });

  it("warms the connection and the lead and order queries", async () => {
    const calls: string[] = [];
    const client = {
      $queryRaw: vi.fn(() => {
        calls.push("select 1");
        return Promise.resolve([]);
      }),
      lead: { findFirst: vi.fn(() => (calls.push("lead"), Promise.resolve(null))) },
      order: { findFirst: vi.fn(() => (calls.push("order"), Promise.resolve(null))) },
    };
    await warmUp(client as never);
    expect(calls).toEqual(["select 1", "lead", "order"]);
  });
});
