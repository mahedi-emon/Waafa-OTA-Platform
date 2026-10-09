import { z } from "zod";
import { IdSchema, IsoDateTimeSchema, SampleFlagSchema } from "./common";

/** Staff roles (PRD §4); one person can hold several. B2B Agent arrives in Phase 3. */
export const RoleSchema = z.enum([
  "super-admin",
  "admin",
  "travel-sales",
  "visa-officer",
  "shop-manager",
  "content-editor",
  "accounts",
]);

export const StaffUserSchema = z
  .object({
    id: IdSchema,
    name: z.string().min(1).max(80),
    initials: z.string().min(1).max(3),
    email: z.email(),
    roles: z.array(RoleSchema).min(1),
    status: z.enum(["active", "invited", "deactivated"]),
    lastLoginAt: IsoDateTimeSchema.optional(),
    sample: SampleFlagSchema,
  })
  .strict();

/** Every admin write is audited with before and after values (PRD §13). */
export const AuditEntrySchema = z
  .object({
    id: IdSchema,
    actorId: IdSchema,
    action: z.string().min(1).max(60),
    entity: z.string().min(1).max(40),
    entityId: z.string().min(1).max(64),
    before: z.unknown().optional(),
    after: z.unknown().optional(),
    reason: z.string().max(300).optional(),
    at: IsoDateTimeSchema,
    sample: SampleFlagSchema,
  })
  .strict();

export type Role = z.infer<typeof RoleSchema>;
export type StaffUser = z.infer<typeof StaffUserSchema>;
export type AuditEntry = z.infer<typeof AuditEntrySchema>;
