import {
  canEditContentKey,
  leadModulesForRoles,
  type ContentKey,
  type LeadModule,
} from "@waafa/shared";
import type { StaffPrincipal } from "../auth/principal";
import { problems } from "../common/problem";

/*
 * Who may do what (PRD §4 roles): the rules live in packages/shared (helpers/access.ts) so the admin shows exactly
 * what the API allows. Super Admin passes everything; Admin / Manager passes everything except users and roles.
 */

/** The lead modules this person works on; empty means no lead access. */
export function leadModulesFor(staff: StaffPrincipal): LeadModule[] {
  return leadModulesForRoles(staff.roles);
}

export function assertLeadAccess(staff: StaffPrincipal, module: string): void {
  if (!leadModulesFor(staff).includes(module as LeadModule))
    throw problems.notFound("Lead not found");
}

export function canEditContent(staff: StaffPrincipal, key: ContentKey): boolean {
  return canEditContentKey(staff.roles, key);
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
