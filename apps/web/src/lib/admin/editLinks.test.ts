import { describe, expect, it } from "vitest";
import { editTargetFor, sectionEditHref } from "./editLinks";

describe("editTargetFor (D0 R7)", () => {
  it("opens the screen behind a site page", () => {
    expect(editTargetFor("/")).toEqual({
      href: "/secure-admin-control/website/home",
      key: "homeSections",
    });
    expect(editTargetFor("/about-us")?.href).toBe("/secure-admin-control/content/pages/about-us");
    expect(editTargetFor("/shop/printing-solutions")?.href).toBe(
      "/secure-admin-control/content/servicePages/printing",
    );
    expect(editTargetFor("/feedback")).toEqual({
      href: "/secure-admin-control/feedback",
      roles: ["admin", "content-editor"],
    });
  });

  it("opens a record's editor from its page", () => {
    expect(editTargetFor("/tour-packages/bali-escape")).toEqual({
      href: "/secure-admin-control/content/tourPackages/bali-escape",
      key: "tourPackages",
    });
    expect(editTargetFor("/shop/p/hp-26a/")?.href).toBe(
      "/secure-admin-control/content/products/hp-26a",
    );
    expect(editTargetFor("/flights/group-fares")?.href).toBe(
      "/secure-admin-control/content/groupFares",
    );
  });

  it("ignores the locale prefix and returns null where nothing edits the page", () => {
    expect(editTargetFor("/bn/visa/thailand", ["en", "bn"])?.href).toBe(
      "/secure-admin-control/content/visaCountries/thailand",
    );
    expect(editTargetFor("/bn", ["en", "bn"])?.href).toBe("/secure-admin-control/website/home");
    expect(editTargetFor("/visa/thailand/apply")).toBeNull();
    expect(editTargetFor("/account")).toBeNull();
    expect(editTargetFor("/visa///")?.href).toBe("/secure-admin-control/content/visaCountries");
    // A path made of slashes stays cheap (no backtracking regex on what a browser sends).
    const started = performance.now();
    expect(editTargetFor(`/${"/".repeat(50_000)}x`)).toBeNull();
    expect(performance.now() - started).toBeLessThan(200);
  });
});

describe("sectionEditHref", () => {
  it("opens one section's sheet", () => {
    expect(sectionEditHref("hero")).toBe("/secure-admin-control/website/home?section=hero");
    expect(sectionEditHref("homeSections:team")).toBe(
      "/secure-admin-control/website/home?section=team",
    );
    expect(sectionEditHref("other")).toBeNull();
  });
});
