import { describe, expect, it } from "vitest";
import { CONTENT_KEYS, hasRecordOrder } from "./registry";

describe("hasRecordOrder", () => {
  it("is true for lists the site sorts by their own order", () => {
    for (const key of [
      "faqs",
      "team",
      "homeSections",
      "banners",
      "categories",
      "flightRoutes",
    ] as const)
      expect(hasRecordOrder(key)).toBe(true);
  });

  it("is false for lists without an order and for settings", () => {
    for (const key of [
      "blogPosts",
      "tourPackages",
      "products",
      "siteSettings",
      "airports",
    ] as const)
      expect(hasRecordOrder(key)).toBe(false);
  });

  it("knows every key", () => {
    expect(CONTENT_KEYS.filter(hasRecordOrder).sort()).toEqual(
      [
        "banners",
        "campaigns",
        "categories",
        "collections",
        "destinations",
        "faqs",
        "flightRoutes",
        "homeSections",
        "hotels",
        "pageBlocks",
        "storeRows",
        "team",
        "timeline",
        "trustItems",
        "values",
      ].sort(),
    );
  });
});
