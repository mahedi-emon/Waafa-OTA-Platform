import { describe, expect, it } from "vitest";
import messages from "../../../messages/en.json";
import {
  ADMIN_NAV,
  NEW_RECORDS,
  SETTINGS_ITEM,
  activeKey,
  allItems,
  groupOf,
  navFor,
  newRecordsFor,
} from "./navigation";

const admin = messages.Admin as unknown as Record<string, Record<string, unknown>>;

describe("admin navigation strings", () => {
  it("has a label and a one-line help for every item, group, badge and + New entry", () => {
    const items = [...ADMIN_NAV.flatMap((group) => group.items), SETTINGS_ITEM];
    for (const group of ADMIN_NAV)
      expect(admin.nav?.[group.label], group.label).toBeTypeOf("string");
    for (const item of items) {
      expect(admin.nav?.[item.label], `nav.${item.label}`).toBeTypeOf("string");
      expect(admin.navHelp?.[item.key], `navHelp.${item.key}`).toBeTypeOf("string");
      for (const count of [item.badge, item.urgent].filter(Boolean))
        expect(admin.counts?.[count as string], `counts.${count}`).toBeTypeOf("string");
    }
    for (const group of NEW_RECORDS) {
      expect(admin.newMenu?.[group.label], `newMenu.${group.label}`).toBeTypeOf("string");
      for (const item of group.items)
        expect(admin.newMenu?.[item.label], `newMenu.${item.label}`).toBeTypeOf("string");
    }
  });
});

const keysFor = (...roles: Parameters<typeof navFor>[0]) =>
  allItems(navFor(roles), roles).map((item) => item.key);

describe("admin navigation (ADMIN.md §3.1)", () => {
  it("groups the sidebar as Home, Inbox, Travel, Waafa’s World and Website", () => {
    expect(ADMIN_NAV.map((group) => group.label)).toEqual([
      "home",
      "inbox",
      "travel",
      "store",
      "website",
    ]);
    expect(groupOf(ADMIN_NAV, "groupFares")?.label).toBe("travel");
    expect(groupOf(ADMIN_NAV, "visaApplications")?.label).toBe("inbox");
  });

  it("shows a Content Editor website and travel content, never orders, leads or settings", () => {
    const keys = keysFor("content-editor");
    expect(keys).toEqual(
      expect.arrayContaining(["feedback", "packages", "homePage", "blog", "team"]),
    );
    expect(keys).not.toContain("orders");
    expect(keys).not.toContain("leads");
    expect(keys).not.toContain("menus");
    expect(keys).not.toContain("settings");
  });

  it("shows Accounts the store money screens and Settings", () => {
    const keys = keysFor("accounts");
    expect(keys).toEqual(expect.arrayContaining(["orders", "proofs", "reports", "settings"]));
    expect(keys).not.toContain("products");
  });

  it("shows a Super Admin everything with Settings last", () => {
    const keys = keysFor("super-admin");
    expect(keys).toEqual(
      expect.arrayContaining(["leads", "orders", "products", "menus", "mediaLibrary"]),
    );
    expect(keys.at(-1)).toBe("settings");
  });

  it("offers + New only for records the role can edit", () => {
    const shop = newRecordsFor(["shop-manager"]).flatMap((group) =>
      group.items.map((item) => item.key),
    );
    expect(shop).toContain("products");
    expect(shop).not.toContain("tourPackages");
    expect(newRecordsFor(["accounts"])).toEqual([]);
  });

  it("marks the most specific item active, including related pages", () => {
    const items = allItems(navFor(["super-admin"]), ["super-admin"]);
    expect(activeKey("/secure-admin-control", "", items)).toBe("dashboard");
    expect(activeKey("/secure-admin-control/leads/abc", "", items)).toBe("leads");
    expect(activeKey("/secure-admin-control/leads", "?module=visa", items)).toBe("leads");
    expect(activeKey("/secure-admin-control/visa-applications", "", items)).toBe(
      "visaApplications",
    );
    expect(activeKey("/secure-admin-control/leads/abc", "?stage=submitted&queue=visa", items)).toBe(
      "visaApplications",
    );
    expect(activeKey("/en/secure-admin-control/content/products/x", "", items)).toBe("products");
    expect(activeKey("/secure-admin-control/content/airports/DAC", "", items)).toBe("airlines");
    expect(activeKey("/secure-admin-control/content/homeSections", "", items)).toBe("homePage");
    expect(activeKey("/secure-admin-control/website/home", "?section=team", items)).toBe(
      "homePage",
    );
    expect(activeKey("/secure-admin-control/website/menus", "", items)).toBe("menus");
    expect(activeKey("/secure-admin-control/content/menus/header", "", items)).toBe("menus");
    expect(activeKey("/secure-admin-control/content/contactSettings", "", items)).toBe("settings");
    expect(activeKey("/secure-admin-control/users", "", items)).toBe("settings");
    expect(activeKey("/secure-admin-control/search", "", items)).toBe("reports");
    expect(activeKey("/secure-admin-control/content", "", items)).toBe("settings");
  });
});
