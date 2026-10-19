import { CONTENT_MODEL, type ContentKey } from "../content/registry";
import type { Role } from "../schemas/admin";
import type { LeadModule } from "../schemas/leads";

/*
 * Who may do what (PRD §4 roles), shared by the API (enforcement) and the admin (what to show). Super Admin passes
 * everything; Admin / Manager passes everything except users and roles. The other roles see the leads of their
 * modules and edit the content of their area.
 */

export const ALL_LEAD_MODULES: readonly LeadModule[] = [
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

export function isManagerRole(roles: readonly Role[]): boolean {
  return roles.includes("super-admin") || roles.includes("admin");
}

/** True when the person holds one of the roles (Super Admin and Admin always pass). */
export function hasAnyRole(roles: readonly Role[], ...wanted: Role[]): boolean {
  return isManagerRole(roles) || wanted.some((role) => roles.includes(role));
}

/** The lead modules this person works on; empty means no lead access. */
export function leadModulesForRoles(roles: readonly Role[]): LeadModule[] {
  if (isManagerRole(roles)) return [...ALL_LEAD_MODULES];
  const modules = new Set<LeadModule>();
  for (const role of roles) for (const module of MODULES_BY_ROLE[role] ?? []) modules.add(module);
  return [...modules];
}

export function canEditContentKey(roles: readonly Role[], key: ContentKey): boolean {
  if (isManagerRole(roles)) return true;
  const owners = KEY_OWNERS[key] ?? GROUP_OWNERS[CONTENT_MODEL[key].group];
  return owners.some((role) => roles.includes(role));
}
