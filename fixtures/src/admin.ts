import type { AuditEntrySchema, StaffUserSchema } from "@waafa/shared";
import type { In } from "./input";

/**
 * Admin users and audit samples (PRD §4, §13). Role-named sample accounts only: no owner details
 * and no real staff until the owner supplies them (PRD §2).
 */
export const staffUsers: In<typeof StaffUserSchema>[] = [
  {
    id: "staff-super",
    name: "Sample Super Admin",
    initials: "SA",
    email: "super.admin@example.com",
    roles: ["super-admin"],
    status: "active",
    lastLoginAt: "2026-10-09T09:12:00+06:00",
    sample: true,
  },
  {
    id: "staff-sales",
    name: "Sample Sales",
    initials: "SS",
    email: "sales@example.com",
    roles: ["travel-sales"],
    status: "active",
    lastLoginAt: "2026-10-09T10:05:00+06:00",
    sample: true,
  },
  {
    id: "staff-visa",
    name: "Sample Visa Officer",
    initials: "VO",
    email: "visa@example.com",
    roles: ["visa-officer"],
    status: "active",
    lastLoginAt: "2026-10-08T17:40:00+06:00",
    sample: true,
  },
  {
    id: "staff-shop",
    name: "Sample Shop Manager",
    initials: "SM",
    email: "shop@example.com",
    roles: ["shop-manager"],
    status: "active",
    sample: true,
  },
  {
    id: "staff-content",
    name: "Sample Content Editor",
    initials: "CE",
    email: "content@example.com",
    roles: ["content-editor"],
    status: "invited",
    sample: true,
  },
  {
    id: "staff-accounts",
    name: "Sample Accounts",
    initials: "AC",
    email: "accounts@example.com",
    roles: ["accounts", "shop-manager"],
    status: "active",
    sample: true,
  },
];

export const auditLog: In<typeof AuditEntrySchema>[] = [
  {
    id: "audit-1",
    actorId: "system",
    action: "settings.create",
    entity: "bookingModes",
    entityId: "all",
    reason: "First deploy",
    at: "2026-10-07T18:38:00+06:00",
    sample: true,
  },
  {
    id: "audit-2",
    actorId: "staff-super",
    action: "bookingModes.update",
    entity: "bookingModes",
    entityId: "all",
    after: { mode: "manual", liveLocked: true },
    reason: "Launch configuration",
    at: "2026-10-07T18:40:00+06:00",
    sample: true,
  },
];
