import { CONTENT_MODEL, type ContentKey, type LeadModule, type Role } from "@waafa/shared";
import type { StaffPrincipal } from "../auth/principal";
import { problems } from "../common/problem";

/*
 * Who may do what (PRD §4 roles). Super Admin passes everything; Admin / Manager passes everything except users and
 * roles. The other roles see the leads of their modules and edit the content of their area.
 */

const ALL_MODULES: LeadModule[] = [
  "flights",
  "hotels",
  "packages",
  "plan-trip",
  "visa",
  "printing",
  "trading",
  "contact",
  "emi",
  "bulk",
];

const MODULES_BY_ROLE: Partial<Record<Role, LeadModule[]>> = {
  "travel-sales": ["flights", "hotels", "packages", "plan-trip", "contact", "emi", "bulk"],
  "visa-officer": ["visa"],
  "shop-manager": ["printing", "trading", "bulk"],
};

const isManager = (staff: StaffPrincipal) =>
  staff.roles.includes("super-admin") || staff.roles.includes("admin");

/** The lead modules this person works on; empty means no lead access. */
export function leadModulesFor(staff: StaffPrincipal): LeadModule[] {
  if (isManager(staff)) return ALL_MODULES;
  const modules = new Set<LeadModule>();
  for (const role of staff.roles)
    for (const module of MODULES_BY_ROLE[role] ?? []) modules.add(module);
  return [...modules];
}

export function assertLeadAccess(staff: StaffPrincipal, module: string): void {
  if (!leadModulesFor(staff).includes(module as LeadModule))
    throw problems.notFound("Lead not found");
}

/** Content areas by role; settings keys with their own owner are listed separately. */
const KEY_OWNERS: Partial<Record<ContentKey, Role[]>> = {
  shippingSettings: ["shop-manager"],
  paymentSettings: ["accounts"],
  announcements: ["content-editor"],
  emiSettings: ["content-editor", "accounts"],
};

const GROUP_OWNERS: Record<(typeof CONTENT_MODEL)[ContentKey]["group"], Role[]> = {
  settings: [],
  home: ["content-editor"],
  content: ["content-editor"],
  travel: ["content-editor", "travel-sales"],
  visa: ["visa-officer", "content-editor"],
  shop: ["shop-manager"],
};

export function canEditContent(staff: StaffPrincipal, key: ContentKey): boolean {
  if (isManager(staff)) return true;
  const owners = KEY_OWNERS[key] ?? GROUP_OWNERS[CONTENT_MODEL[key].group];
  return owners.some((role) => staff.roles.includes(role));
}

export function assertContentAccess(staff: StaffPrincipal, key: ContentKey): void {
  if (!canEditContent(staff, key)) throw problems.forbidden();
}

/** Asia/Dhaka is UTC+6 all year: the instant the Dhaka day (or month) of `now` began. */
export function dhakaStart(now: Date, unit: "day" | "month"): Date {
  const shifted = new Date(now.getTime() + 6 * 60 * 60_000);
  const day = unit === "day" ? shifted.getUTCDate() : 1;
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), day) - 6 * 60 * 60_000);
}

/** A YYYY-MM-DD date read as the start of that day in Dhaka. */
export function dhakaDate(date: string, endOfDay = false): Date {
  const start = new Date(`${date}T00:00:00+06:00`);
  return endOfDay ? new Date(start.getTime() + 24 * 60 * 60_000) : start;
}
