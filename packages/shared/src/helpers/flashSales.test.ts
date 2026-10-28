import { describe, expect, it } from "vitest";
import { dealIsLive, dealsWithinCap } from "./deals";

describe("flash sales (issue 247)", () => {
  const now = new Date("2026-11-05T06:00:00Z");

  it("applies a deal only between its start and its end", () => {
    expect(dealIsLive({ endsAt: "2026-11-06T00:00:00Z" }, now)).toBe(true);
    expect(
      dealIsLive({ startsAt: "2026-11-05T07:00:00Z", endsAt: "2026-11-06T00:00:00Z" }, now),
    ).toBe(false);
    expect(
      dealIsLive({ startsAt: "2026-11-05T05:00:00Z", endsAt: "2026-11-05T06:00:00Z" }, now),
    ).toBe(false);
  });

  it("keeps a capped deal only while the cap holds the wanted units", () => {
    const deals = [
      { id: "d1", variantId: "v1", stockCap: 3 },
      { id: "d2", variantId: "v2" },
    ];
    const sold = new Map([["d1", 2]]);
    expect(
      dealsWithinCap(deals, sold, [{ variantId: "v1", quantity: 1 }]).map((d) => d.id),
    ).toEqual(["d1", "d2"]);
    expect(
      dealsWithinCap(deals, sold, [{ variantId: "v1", quantity: 2 }]).map((d) => d.id),
    ).toEqual(["d2"]);
    expect(dealsWithinCap(deals, new Map([["d1", 3]]), []).map((d) => d.id)).toEqual(["d2"]);
  });
});
