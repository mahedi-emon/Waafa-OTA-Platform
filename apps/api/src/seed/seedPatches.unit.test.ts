import { describe, expect, it } from "vitest";
import { moveVisaLinks, moveVisaPath, renameVisaNavItem } from "./seedPatches";

describe("moveVisaPath (issue 176)", () => {
  it("moves the visa list, country and apply paths to /visa", () => {
    expect(moveVisaPath("/visa-services")).toBe("/visa");
    expect(moveVisaPath("/visa-services/thailand")).toBe("/visa/thailand");
    expect(moveVisaPath("/visa-services/thailand/apply")).toBe("/visa/thailand/apply");
    expect(moveVisaPath("/visa-services?region=asia")).toBe("/visa?region=asia");
    expect(moveVisaPath("/visa-services#types")).toBe("/visa#types");
  });

  it("leaves every other value alone", () => {
    for (const value of [
      "/visa",
      "/visa-guide/thailand",
      "/visa-servicesx",
      "visa-services-header",
      "Visa Services",
      "https://example.com/visa-services",
    ]) {
      expect(moveVisaPath(value)).toBe(value);
    }
  });
});

describe("moveVisaLinks", () => {
  it("moves links anywhere in a stored record and keeps the rest", () => {
    const banner = {
      id: "b1",
      cta: { label: "See visa services", href: "/visa-services/malaysia" },
      tags: ["/visa-services", "visa"],
      order: 2,
      sample: true,
      image: null,
    };
    expect(moveVisaLinks(banner)).toEqual({
      id: "b1",
      cta: { label: "See visa services", href: "/visa/malaysia" },
      tags: ["/visa", "visa"],
      order: 2,
      sample: true,
      image: null,
    });
  });
});

describe("renameVisaNavItem", () => {
  const item = { id: "visa", label: "Visa Services", href: "/visa", icon: "stamp" };

  it("renames the visa item of the header and the phone drawer", () => {
    for (const key of ["header", "drawer"]) {
      const menu = renameVisaNavItem({
        key,
        items: [item, { id: "home", label: "Home", href: "/" }],
      });
      expect(menu).toEqual({
        key,
        items: [
          { ...item, label: "Visa" },
          { id: "home", label: "Home", href: "/" },
        ],
      });
    }
  });

  it("keeps the footer label and any label the admin already changed", () => {
    expect(renameVisaNavItem({ key: "footer-travel", items: [item] })).toEqual({
      key: "footer-travel",
      items: [item],
    });
    const custom = { ...item, label: "Visas" };
    expect(renameVisaNavItem({ key: "header", items: [custom] })).toEqual({
      key: "header",
      items: [custom],
    });
  });
});
