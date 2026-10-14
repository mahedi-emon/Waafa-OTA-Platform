import { describe, expect, it } from "vitest";
import {
  addSecondPhone,
  moveVisaLinks,
  moveVisaPath,
  renameVisaNavItem,
  updateHomeSeo,
} from "./seedPatches";

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

describe("addSecondPhone (issue 181)", () => {
  const second = { display: "01823-232242", e164: "+8801823232242" };
  const contact = {
    phoneDisplay: "01823-232241",
    phoneE164: "+8801823232241",
    email: "info@waafasworld.com",
  };

  it("adds 01823-232242 after the main number when no extra numbers are set", () => {
    expect(addSecondPhone(contact)).toEqual({ ...contact, extraPhones: [second] });
    expect(addSecondPhone({ ...contact, extraPhones: [] })).toEqual({
      ...contact,
      extraPhones: [second],
    });
  });

  it("keeps numbers an admin set and contacts with another main number", () => {
    const custom = {
      ...contact,
      extraPhones: [{ display: "01711-000000", e164: "+8801711000000" }],
    };
    expect(addSecondPhone(custom)).toBe(custom);
    const moved = { ...contact, phoneE164: "+8801711000000" };
    expect(addSecondPhone(moved)).toBe(moved);
    expect(addSecondPhone(null)).toBeNull();
  });
});

describe("updateHomeSeo (issue 184)", () => {
  const launch = {
    travelBrand: "Waafa Tours and Travel",
    defaultSeo: {
      title: "Waafa Tours and Travel · Flights, tours and visas from Dhaka",
      description:
        "Flights, hotels, tour packages and visas from our Motijheel office, plus Waafas World by Waafa International. A real person confirms every price.",
    },
  };

  it("replaces the launch title and description with the search wording", () => {
    expect(updateHomeSeo(launch)).toEqual({
      travelBrand: "Waafa Tours and Travel",
      defaultSeo: {
        title: "Waafa Tours and Travel: Travel Agency in Dhaka, Bangladesh",
        description:
          "Air tickets, visa processing, tour packages and hotel booking from our Motijheel office in Dhaka, plus Waafas World by Waafa International.",
      },
    });
  });

  it("keeps any field an admin already changed, and values that are not settings", () => {
    const edited = { ...launch, defaultSeo: { ...launch.defaultSeo, title: "Our own title" } };
    expect(updateHomeSeo(edited)).toMatchObject({ defaultSeo: { title: "Our own title" } });
    expect(updateHomeSeo({ travelBrand: "x" })).toEqual({ travelBrand: "x" });
    expect(updateHomeSeo(null)).toBeNull();
  });
});
