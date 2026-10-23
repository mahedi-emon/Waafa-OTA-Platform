import { describe, expect, it } from "vitest";
import { recordChipsOf } from "./chips";

const now = new Date("2026-10-23T10:00:00+06:00");
const later = "2026-10-30T10:00:00+06:00";
const earlier = "2026-10-20T10:00:00+06:00";

describe("list chips (D0 R4)", () => {
  it("reads content from its status and dates", () => {
    expect(recordChipsOf("tourPackages", { status: "draft" }, now)).toEqual([{ name: "draft" }]);
    expect(recordChipsOf("tourPackages", { status: "scheduled", publishAt: later }, now)).toEqual([
      { name: "scheduled", at: new Date(later).toISOString() },
    ]);
    expect(recordChipsOf("blogPosts", { status: "published", liveSince: earlier }, now)).toEqual([
      { name: "live", at: new Date(earlier).toISOString() },
    ]);
    expect(recordChipsOf("pages", { status: "archived" }, now)).toEqual([{ name: "archived" }]);
  });

  it("reads banners and announcements from their window and switch", () => {
    expect(recordChipsOf("banners", { enabled: true, startsAt: later }, now)).toEqual([
      { name: "scheduled", at: later },
    ]);
    expect(
      recordChipsOf("announcements", { enabled: true, startsAt: earlier, endsAt: later }, now),
    ).toEqual([{ name: "live", until: later }]);
    expect(
      recordChipsOf("banners", { enabled: true, startsAt: earlier, endsAt: earlier }, now),
    ).toEqual([{ name: "ended", at: earlier }]);
    expect(recordChipsOf("banners", { enabled: false, startsAt: earlier }, now)).toEqual([
      { name: "off" },
    ]);
    expect(recordChipsOf("deals", { endsAt: earlier }, now)).toEqual([
      { name: "ended", at: earlier },
    ]);
  });

  it("reads coupons from dates and uses", () => {
    const coupon = { enabled: true, startsAt: earlier, maxUses: 20 };
    expect(recordChipsOf("coupons", coupon, now, { uses: 3 })).toEqual([{ name: "active" }]);
    expect(recordChipsOf("coupons", coupon, now, { uses: 20 })).toEqual([
      { name: "usedUp", count: 20 },
    ]);
    expect(recordChipsOf("coupons", { ...coupon, startsAt: later }, now)).toEqual([
      { name: "scheduled", at: later },
    ]);
  });

  it("reads group fares from seats and dates", () => {
    const fare = { expiresAt: later, departDate: "2026-11-10" };
    expect(recordChipsOf("groupFares", { ...fare, seatsLeft: 9 }, now)).toEqual([
      { name: "open", until: later },
    ]);
    expect(recordChipsOf("groupFares", { ...fare, seatsLeft: 2 }, now)).toEqual([
      { name: "fewSeats", count: 2 },
    ]);
    expect(recordChipsOf("groupFares", { ...fare, seatsLeft: 0 }, now)).toEqual([
      { name: "soldOut" },
    ]);
    expect(recordChipsOf("groupFares", { ...fare, expiresAt: earlier }, now)).toEqual([
      { name: "expired", at: earlier },
    ]);
  });

  it("shows a product's workflow and its stock", () => {
    expect(
      recordChipsOf(
        "products",
        {
          status: "published",
          variants: [
            { stock: 1, lowStockAt: 3 },
            { stock: 9, lowStockAt: 3 },
          ],
        },
        now,
      ),
    ).toEqual([{ name: "live" }, { name: "lowStock" }]);
  });

  it("falls back to the show switch, else no chip", () => {
    expect(recordChipsOf("team", { visible: false }, now)).toEqual([{ name: "hidden" }]);
    expect(recordChipsOf("storeRows", { enabled: true }, now)).toEqual([{ name: "shown" }]);
    expect(recordChipsOf("faqs", { question: "Visa?" }, now)).toEqual([]);
  });
});
