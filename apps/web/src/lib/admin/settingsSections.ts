import { canEditContentKey, type ContentKey, type Role } from "@waafa/shared";

const ADMIN = "/secure-admin-control";

/** One tab of a settings section: a settings document (all of it or some of its sections), a list, or a screen. */
export type SettingsTab = {
  id: string;
  /** A settings document edited in place… */
  setting?: ContentKey;
  /** …showing only these blueprint sections (the rest of the document is kept as it is). */
  sections?: readonly string[];
  /** A list of records (EMI banks, message templates), each opening its own editor. */
  list?: ContentKey;
  /** A screen of its own that sits inside the settings frame (Users, Integrations, Audit log). */
  href?: string;
  /** Who sees a screen tab; documents and lists follow the content access rules. Super Admin always passes. */
  roles?: readonly Role[];
};

export type SettingsSectionId =
  | "business"
  | "hours"
  | "modes"
  | "payments"
  | "forms"
  | "seo"
  | "search"
  | "integrations"
  | "users"
  | "audit"
  | "status"
  | "maintenance"
  | "advanced";

export type SettingsSection = { id: SettingsSectionId; tabs: readonly SettingsTab[] };

/** Settings in one place (ADMIN.md §5.6), in the order staff look for them. */
export const SETTINGS_SECTIONS: readonly SettingsSection[] = [
  {
    id: "business",
    tabs: [
      {
        id: "contact",
        setting: "contactSettings",
        sections: ["office", "phones", "email", "socials"],
      },
      { id: "brand", setting: "siteSettings", sections: ["names", "footer"] },
    ],
  },
  { id: "hours", tabs: [{ id: "hours", setting: "contactSettings", sections: ["hours"] }] },
  { id: "modes", tabs: [{ id: "modes", setting: "bookingModes" }] },
  {
    id: "payments",
    tabs: [
      { id: "accounts", setting: "paymentSettings" },
      { id: "delivery", setting: "shippingSettings" },
      { id: "emi", setting: "emiSettings" },
      { id: "banks", list: "emiBanks" },
    ],
  },
  {
    id: "forms",
    tabs: [
      { id: "forms", setting: "leadFormSettings" },
      { id: "messages", list: "notificationTemplates" },
      { id: "sent", href: `${ADMIN}/notifications`, roles: ["admin"] },
    ],
  },
  {
    id: "seo",
    tabs: [
      { id: "tracking", setting: "trackingSettings" },
      { id: "defaults", setting: "siteSettings", sections: ["search"] },
      { id: "connections", setting: "siteSettings", sections: ["connections"] },
    ],
  },
  { id: "search", tabs: [{ id: "search", setting: "searchSettings" }] },
  { id: "integrations", tabs: [{ id: "integrations", href: `${ADMIN}/integrations`, roles: [] }] },
  { id: "users", tabs: [{ id: "users", href: `${ADMIN}/users`, roles: [] }] },
  { id: "audit", tabs: [{ id: "audit", href: `${ADMIN}/audit`, roles: ["admin"] }] },
  { id: "status", tabs: [{ id: "status", href: `${ADMIN}/status`, roles: ["admin"] }] },
  { id: "maintenance", tabs: [{ id: "maintenance", setting: "maintenanceSettings" }] },
  { id: "advanced", tabs: [{ id: "content", href: `${ADMIN}/content`, roles: [] }] },
];

const passes = (roles: readonly Role[], allowed: readonly Role[]) =>
  roles.includes("super-admin") || allowed.some((role) => roles.includes(role));

/** Whether this person may open a tab. */
export function canOpenTab(roles: readonly Role[], tab: SettingsTab): boolean {
  const key = tab.setting ?? tab.list;
  if (key) return canEditContentKey(roles, key);
  return passes(roles, tab.roles ?? []);
}

/** The sections and tabs this person may open, in order; sections with no tab left are dropped. */
export function settingsFor(roles: readonly Role[]): SettingsSection[] {
  return SETTINGS_SECTIONS.map((section) => ({
    ...section,
    tabs: section.tabs.filter((tab) => canOpenTab(roles, tab)),
  })).filter((section) => section.tabs.length > 0);
}

/** A tab's address: screens keep theirs; documents and lists live under /settings/<section>. */
export function tabHref(section: SettingsSection, tab: SettingsTab): string {
  if (tab.href) return tab.href;
  const base = `${ADMIN}/settings/${section.id}`;
  return section.tabs[0]?.id === tab.id ? base : `${base}?tab=${tab.id}`;
}

/** A section's first address for this person (its first tab they may open). */
export function sectionHref(section: SettingsSection): string {
  const first = section.tabs[0];
  return first ? tabHref(section, first) : `${ADMIN}/settings`;
}

/** Where a settings document or list is edited now (old /content/<key> addresses redirect here). */
export function settingsHrefFor(key: ContentKey): string | undefined {
  for (const section of SETTINGS_SECTIONS) {
    const tab = section.tabs.find(
      (candidate) => (candidate.setting === key && !candidate.sections) || candidate.list === key,
    );
    if (tab) return tabHref(section, tab);
  }
  // A document split over several sections opens where its first part lives.
  for (const section of SETTINGS_SECTIONS) {
    const tab = section.tabs.find((candidate) => candidate.setting === key);
    if (tab) return tabHref(section, tab);
  }
  return undefined;
}

/** The section a screen tab belongs to (Users, Integrations, Audit log, Sent messages), for the frame's highlight. */
export function sectionOfHref(href: string): SettingsSectionId | undefined {
  return SETTINGS_SECTIONS.find((section) => section.tabs.some((tab) => tab.href === href))?.id;
}
