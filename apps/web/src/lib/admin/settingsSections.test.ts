import { describe, expect, it } from "vitest";
import { CONTENT_MODEL, type ContentKey } from "@waafa/shared";
import { BLUEPRINTS } from "./blueprints/registry";
import {
  SETTINGS_SECTIONS,
  sectionHref,
  sectionOfHref,
  settingsFor,
  settingsHrefFor,
} from "./settingsSections";

describe("settings sections", () => {
  it("give a Super Admin every section, and accounts only what they edit", () => {
    expect(settingsFor(["super-admin"]).map((section) => section.id)).toEqual(
      SETTINGS_SECTIONS.map((section) => section.id),
    );
    const accounts = settingsFor(["accounts"]);
    expect(accounts.map((section) => section.id)).toEqual(["payments"]);
    expect(accounts[0]?.tabs.every((tab) => tab.setting || tab.list)).toBe(true);
  });

  it("open each settings document at its section, and screens keep their own address", () => {
    const business = SETTINGS_SECTIONS.find((section) => section.id === "business");
    expect(business && sectionHref(business)).toBe("/secure-admin-control/settings/business");
    expect(settingsHrefFor("paymentSettings")).toBe("/secure-admin-control/settings/payments");
    expect(settingsHrefFor("shippingSettings")).toBe(
      "/secure-admin-control/settings/payments?tab=delivery",
    );
    expect(settingsHrefFor("notificationTemplates")).toBe(
      "/secure-admin-control/settings/forms?tab=messages",
    );
    // A document split over sections opens where its first part lives.
    expect(settingsHrefFor("contactSettings")).toBe("/secure-admin-control/settings/business");
    // Menus and the footer stay with the website builder.
    expect(settingsHrefFor("footerSettings")).toBeUndefined();
    expect(sectionOfHref("/secure-admin-control/users")).toBe("users");
  });

  it("leave no part of a split settings document without a place", () => {
    const parts = new Map<ContentKey, Set<string>>();
    for (const section of SETTINGS_SECTIONS)
      for (const tab of section.tabs)
        if (tab.setting && tab.sections) {
          const seen = parts.get(tab.setting) ?? new Set<string>();
          for (const part of tab.sections) seen.add(part);
          parts.set(tab.setting, seen);
        }
    for (const [key, seen] of parts)
      for (const part of BLUEPRINTS[key].sections)
        expect([...seen], `${key}#${part.id}`).toContain(part.id);
  });

  it("name only settings documents and real blueprint sections", () => {
    for (const section of SETTINGS_SECTIONS) {
      for (const tab of section.tabs) {
        const key = (tab.setting ?? tab.list) as ContentKey | undefined;
        if (!key) continue;
        // Documents are settings; lists are short ones that belong with a setting (EMI banks, templates).
        if (tab.setting) {
          expect(CONTENT_MODEL[key].group, `${section.id}/${tab.id}`).toBe("settings");
          expect(CONTENT_MODEL[key].kind).toBe("singleton");
        } else expect(CONTENT_MODEL[key].kind).toBe("collection");
        if (tab.sections) {
          const ids = BLUEPRINTS[key].sections.map((part) => part.id);
          for (const part of tab.sections) expect(ids, `${key}#${part}`).toContain(part);
        }
      }
    }
  });
});
