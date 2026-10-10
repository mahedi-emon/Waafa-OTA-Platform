import { z } from "zod";
import { IdSchema, IsoDateSchema, IsoDateTimeSchema, SampleFlagSchema, TakaSchema } from "./common";
import { LeadModuleSchema, LeadPrioritySchema, LeadStatusSchema } from "./leads";
import { OrderStatusSchema } from "./shop";

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

/* ---------- Admin API contracts (B4): what the admin screens send ---------- */

const paging = {
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
};

const somethingToChange = (value: object) =>
  Object.values(value).some((item) => item !== undefined);

/** Lead list filters (FR-ADM-LEAD): saved views, module, status, agent, created dates and a search box. */
export const LeadListQuerySchema = z
  .object({
    view: z.enum(["all", "open", "mine", "unassigned", "overdue"]).default("all"),
    module: LeadModuleSchema.optional(),
    status: LeadStatusSchema.optional(),
    assigneeId: IdSchema.optional(),
    q: z.string().trim().max(80).optional(),
    createdFrom: IsoDateSchema.optional(),
    createdTo: IsoDateSchema.optional(),
    ...paging,
  })
  .strict();

/** Status, priority and assignee changes; Booked needs an amount, Cancelled and Lost need a reason. */
export const LeadUpdateInputSchema = z
  .object({
    status: LeadStatusSchema.optional(),
    priority: LeadPrioritySchema.optional(),
    assigneeId: IdSchema.nullable().optional(),
    amount: TakaSchema.optional(),
    reason: z.string().trim().min(3).max(300).optional(),
  })
  .strict()
  .refine(somethingToChange, { message: "Nothing to change" })
  .superRefine((value, ctx) => {
    if (value.status === "booked" && value.amount === undefined) {
      ctx.addIssue({ code: "custom", path: ["amount"], message: "Enter the booked amount" });
    }
    if ((value.status === "cancelled" || value.status === "lost") && !value.reason) {
      ctx.addIssue({ code: "custom", path: ["reason"], message: "Give the reason" });
    }
  });

export const LeadNoteInputSchema = z
  .object({
    type: z.enum(["note", "call", "email", "whatsapp"]).default("note"),
    body: z.string().trim().min(1).max(2000),
  })
  .strict();

/** Bulk assign and status change; statuses that need an amount or a reason are set one by one. */
export const LeadBulkInputSchema = z
  .object({
    ids: z.array(IdSchema).min(1).max(100),
    status: LeadStatusSchema.exclude(["booked", "cancelled", "lost"]).optional(),
    assigneeId: IdSchema.nullable().optional(),
  })
  .strict()
  .refine((value) => value.status !== undefined || value.assigneeId !== undefined, {
    message: "Nothing to change",
  });

export const OrderListQuerySchema = z
  .object({
    status: OrderStatusSchema.optional(),
    q: z.string().trim().max(80).optional(),
    ...paging,
  })
  .strict();

/** Order workflow (FR-SHOP-09): status with courier and tracking number, payment verified, a note. */
export const OrderUpdateInputSchema = z
  .object({
    status: OrderStatusSchema.optional(),
    note: z.string().trim().min(1).max(300).optional(),
    courier: z.string().trim().min(2).max(60).optional(),
    trackingNumber: z.string().trim().min(3).max(60).optional(),
    paymentVerified: z.boolean().optional(),
  })
  .strict()
  .refine(somethingToChange, { message: "Nothing to change" })
  .superRefine((value, ctx) => {
    if (value.status === "shipped" && !value.courier) {
      ctx.addIssue({ code: "custom", path: ["courier"], message: "Name the courier" });
    }
  });

export const FeedbackListQuerySchema = z
  .object({ status: z.enum(["pending", "approved", "hidden"]).optional(), ...paging })
  .strict();

export const FeedbackModerationInputSchema = z
  .object({ status: z.enum(["pending", "approved", "hidden"]) })
  .strict();

export const PaymentProofListQuerySchema = z
  .object({ status: z.enum(["received", "verified", "rejected"]).optional(), ...paging })
  .strict();

export const PaymentProofReviewInputSchema = z
  .object({
    status: z.enum(["received", "verified", "rejected"]),
    note: z.string().trim().min(1).max(300).optional(),
  })
  .strict();

export const SearchLogListQuerySchema = z
  .object({
    module: z.enum(["flights", "hotels", "packages", "visa"]).optional(),
    from: IsoDateSchema.optional(),
    to: IsoDateSchema.optional(),
    ...paging,
  })
  .strict();

export const PagingQuerySchema = z.object(paging).strict();

export const AuditListQuerySchema = z
  .object({
    entity: z.string().trim().min(1).max(40).optional(),
    actorId: IdSchema.optional(),
    ...paging,
  })
  .strict();

const PasswordSchema = z.string().min(12, "Use at least 12 characters").max(200);

export const StaffCreateInputSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.email().max(160),
    roles: z.array(RoleSchema).min(1),
    password: PasswordSchema,
  })
  .strict();

export const StaffUpdateInputSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    roles: z.array(RoleSchema).min(1).optional(),
    status: z.enum(["active", "deactivated"]).optional(),
  })
  .strict()
  .refine(somethingToChange, { message: "Nothing to change" });

export const PasswordSetInputSchema = z.object({ password: PasswordSchema }).strict();

export const PasswordChangeInputSchema = z
  .object({ current: z.string().min(1).max(200), next: PasswordSchema })
  .strict();

/** A content record or settings value; the server validates `data` with the CONTENT_MODEL schema of the key. */
export const ContentWriteInputSchema = z
  .object({ data: z.unknown(), version: z.number().int().min(1).optional() })
  .strict();

export const ContentOrderInputSchema = z
  .object({ ids: z.array(z.string().min(1).max(160)).min(1).max(2000) })
  .strict();

export type Role = z.infer<typeof RoleSchema>;
export type StaffUser = z.infer<typeof StaffUserSchema>;
export type AuditEntry = z.infer<typeof AuditEntrySchema>;
export type LeadListQuery = z.infer<typeof LeadListQuerySchema>;
export type LeadUpdateInput = z.infer<typeof LeadUpdateInputSchema>;
export type LeadNoteInput = z.infer<typeof LeadNoteInputSchema>;
export type LeadBulkInput = z.infer<typeof LeadBulkInputSchema>;
export type OrderListQuery = z.infer<typeof OrderListQuerySchema>;
export type OrderUpdateInput = z.infer<typeof OrderUpdateInputSchema>;
export type FeedbackModerationInput = z.infer<typeof FeedbackModerationInputSchema>;
export type PaymentProofReviewInput = z.infer<typeof PaymentProofReviewInputSchema>;
export type StaffCreateInput = z.infer<typeof StaffCreateInputSchema>;
export type StaffUpdateInput = z.infer<typeof StaffUpdateInputSchema>;
export type ContentWriteInput = z.infer<typeof ContentWriteInputSchema>;
