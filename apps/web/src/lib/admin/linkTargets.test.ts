import { describe, expect, it } from "vitest";
import { describeHref, normaliseWebAddress, recordHref } from "./linkTargets";

const SITE = "https://waafasworld.com";

describe("link targets (D0 R7)", () => {
  it("names site pages, records, phones, emails and web addresses", () => {
    expect(describeHref("/")).toEqual({ kind: "page", page: "home", path: "/" });
    expect(describeHref("/flights/group-fares")).toEqual({
      kind: "page",
      page: "groupFares",
      path: "/flights/group-fares",
    });
    expect(describeHref("/tour-packages/bali-temples")).toEqual({
      kind: "record",
      key: "tourPackages",
      id: "bali-temples",
      path: "/tour-packages/bali-temples",
    });
    expect(describeHref("/flights/dac-bkk")).toMatchObject({ kind: "record", key: "flightRoutes" });
    expect(describeHref("tel:+8801712345678")).toEqual({ kind: "phone", number: "+8801712345678" });
    expect(describeHref("mailto:hello@example.com")).toEqual({
      kind: "email",
      address: "hello@example.com",
    });
    expect(describeHref("https://www.facebook.com/waafa")).toEqual({
      kind: "web",
      url: "https://www.facebook.com/waafa",
    });
    expect(describeHref("")).toBeNull();
  });

  it("treats this site's own full addresses as its pages, and keeps unknown paths", () => {
    expect(describeHref(`${SITE}/visa`, SITE)).toEqual({
      kind: "page",
      page: "visa",
      path: "/visa",
    });
    expect(describeHref("/visa/thailand/apply")).toEqual({
      kind: "path",
      path: "/visa/thailand/apply",
    });
    expect(describeHref("/shop?sort=new")).toEqual({ kind: "page", page: "shop", path: "/shop" });
  });

  it("writes a record's page and cleans typed web addresses", () => {
    expect(recordHref("products", "bd-cf280a")).toBe("/shop/p/bd-cf280a");
    expect(normaliseWebAddress("facebook.com/waafa")).toBe("https://facebook.com/waafa");
    expect(normaliseWebAddress("http://example.com/a?b=1")).toBe("https://example.com/a?b=1");
    expect(normaliseWebAddress("waafasworld.com/visa", SITE)).toBe("/visa");
    expect(normaliseWebAddress("not a site")).toBeNull();
    expect(normaliseWebAddress("localhost")).toBeNull();
  });
});
