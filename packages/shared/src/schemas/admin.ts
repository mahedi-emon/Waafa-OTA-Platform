import { z } from "zod";
import { IdSchema, IsoDateSchema, IsoDateTimeSchema, SampleFlagSchema, TakaSchema } from "./common";
import { FeedbackSchema } from "./content";
import { LeadModuleSchema, LeadPrioritySchema, LeadStatusSchema } from "./leads";
import { OrderStatusSchema } from "./shop";
import { ContentActionSchema } from "./workflow";

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
    /** Newest first unless asked (D0 R5). */
    sort: z.enum(["created.asc", "created.desc"]).optional(),
    ...paging,
  })
  .strict();

/**
 * Priority, assignee and a booked lead's corrected amount. The status is never set here: it follows from the lead's
 * actions (LeadActionInputSchema, D0 R4).
 */
export const LeadUpdateInputSchema = z
  .object({
    priority: LeadPrioritySchema.optional(),
    assigneeId: IdSchema.nullable().optional(),
    amount: TakaSchema.positive().optional(),
  })
  .strict()
  .refine(somethingToChange, { message: "Nothing to change" });

export const LeadNoteInputSchema = z
  .object({
    type: z.enum(["note", "call", "email", "whatsapp"]).default("note"),
    body: z.string().trim().min(1).max(2000),
  })
  .strict();

/** Bulk assign, or Mark as spam; every other step is taken lead by lead with what it needs (D0 R4). */
export const LeadBulkInputSchema = z
  .object({
    ids: z.array(IdSchema).min(1).max(100),
    markSpam: z.literal(true).optional(),
    assigneeId: IdSchema.nullable().optional(),
  })
  .strict()
  .refine((value) => value.markSpam !== undefined || value.assigneeId !== undefined, {
    message: "Nothing to change",
  });

export const OrderListQuerySchema = z
  .object({
    status: OrderStatusSchema.optional(),
    q: z.string().trim().max(80).optional(),
    sort: z.enum(["created.asc", "created.desc", "total.asc", "total.desc"]).optional(),
    ...paging,
  })
  .strict();

/** A note on the order's history. Steps (confirm, pack, ship, deliver, cancel, return) are actions (D0 R4). */
export const OrderUpdateInputSchema = z
  .object({ note: z.string().trim().min(1).max(300) })
  .strict();

export const FeedbackListQuerySchema = z
  .object({
    status: FeedbackSchema.shape.status.optional(),
    q: z.string().trim().max(80).optional(),
    sort: z.enum(["created.asc", "created.desc"]).optional(),
    ...paging,
  })
  .strict();

export const FeedbackModerationInputSchema = z
  .object({ status: FeedbackSchema.shape.status })
  .strict();

/** "To verify" lists proofs received and proofs matched to an order (D0 R4). */
export const PaymentProofListQuerySchema = z
  .object({
    status: z.enum(["received", "matched", "verified", "rejected"]).optional(),
    q: z.string().trim().max(80).optional(),
    sort: z.enum(["created.asc", "created.desc", "amount.asc", "amount.desc"]).optional(),
    ...paging,
  })
  .strict();

/** One page of a content list (D0 R5): words, a status chip, a sort and the page. */
export const ContentListQuerySchema = z
  .object({
    q: z.string().trim().max(80).optional(),
    chip: z
      .string()
      .regex(/^[a-zA-Z]{2,20}$/)
      .optional(),
    sort: z.enum(["title.asc", "title.desc", "updated.asc", "updated.desc"]).optional(),
    page: z.coerce.number().int().min(1).max(10_000).default(1),
    pageSize: z.coerce
      .number()
      .int()
      .refine((size) => [25, 50, 100].includes(size))
      .default(25),
  })
  .strict();

/** The same step for several records at once (D0 R5); each record follows its own rules. */
export const ContentBulkInputSchema = z
  .object({
    ids: z.array(z.string().min(1).max(160)).min(1).max(100),
    action: z.enum(["publish", "unpublish", "archive", "trash"]),
  })
  .strict();

/** One place earlier (-1) or later (1) in the list's own order (D0 R5). */
export const ContentMoveInputSchema = z
  .object({ by: z.union([z.literal(-1), z.literal(1)]) })
  .strict();

/** Trash (D0 R4): newest first, only the lists this person may edit. */
export const TrashListQuerySchema = z.object({ ...paging }).strict();

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

/**
 * A content record or settings value; the server validates `data` with the CONTENT_MODEL schema of the key.
 * `action` is the editor's button (D0 R4): the API derives the status from it, and a plain save keeps the stored
 * one. `keepSample` is the Undo of "no longer Sample" after a record's first staff save.
 */
export const ContentWriteInputSchema = z
  .object({
    data: z.unknown(),
    version: z.number().int().min(1).optional(),
    action: ContentActionSchema.optional(),
    keepSample: z.boolean().optional(),
  })
  .strict();

export const ContentOrderInputSchema = z
  .object({ ids: z.array(z.string().min(1).max(160)).min(1).max(2000) })
  .strict();

/** Work waiting for staff (D0 R1): sidebar badges, the notification bell and the dashboard's Today queue. */
export const InboxCountKeySchema = z.enum([
  "newLeads",
  "overdueLeads",
  "visaWaiting",
  "ordersToConfirm",
  "proofsToVerify",
  "feedbackToReview",
  "lowStock",
  "groupFaresEnding",
  "sampleLeft",
]);

/** One new item for the notification bell: a lead, an order or a payment proof that arrived. */
export const InboxItemSchema = z
  .object({
    kind: z.enum(["lead", "order", "proof"]),
    id: IdSchema,
    /** The person's name; the reference or summary goes in `detail`. */
    title: z.string().min(1).max(120),
    detail: z.string().max(160),
    at: IsoDateTimeSchema,
  })
  .strict();

/** Counts the person may see (keys they can't open are left out) and the newest arrivals. */
export const InboxSummarySchema = z
  .object({
    counts: z.partialRecord(InboxCountKeySchema, z.number().int().min(0)),
    recent: z.array(InboxItemSchema).max(30),
    at: IsoDateTimeSchema,
  })
  .strict();

/** Ctrl+K record search: a name, a reference (FLT-261019-0001) or part of a phone number. */
export const AdminSearchQuerySchema = z.object({ q: z.string().trim().min(2).max(80) }).strict();

export const AdminSearchHitSchema = z
  .object({
    kind: z.enum(["lead", "order", "customer", "record"]),
    id: z.string().min(1).max(160),
    title: z.string().min(1).max(160),
    detail: z.string().max(160).optional(),
    /** CONTENT_MODEL key for records, so the admin can open the right editor. */
    contentKey: z.string().max(40).optional(),
    image: z.string().max(500).optional(),
  })
  .strict();

export const AdminSearchResultSchema = z
  .object({ hits: z.array(AdminSearchHitSchema).max(40) })
  .strict();

/** Form engine v2 (D0 R2): a record's or setting's history from the audit log, newest first. */
export const ContentHistoryEntrySchema = z
  .object({
    id: IdSchema,
    at: IsoDateTimeSchema,
    actorName: z.string(),
    /** content.create, content.update, content.restore, content.duplicate, settings.update, … */
    action: z.string(),
    before: z.unknown().optional(),
    after: z.unknown().optional(),
  })
  .strict();

export const ContentHistorySchema = z
  .object({ entries: z.array(ContentHistoryEntrySchema).max(100) })
  .strict();

/** Make the record look like it did after this audit entry; the version guards against overwriting a newer save. */
export const ContentRestoreInputSchema = z
  .object({
    auditId: IdSchema,
    version: z.number().int().positive().optional(),
    /** The version saved by this change ("after", the default) or the one it replaced ("before"). */
    side: z.enum(["before", "after"]).optional(),
  })
  .strict();

/** One choice for a reference picker: the record's title and photo, and the values other records refer to it by. */
export const ContentOptionSchema = z
  .object({
    id: z.string().min(1).max(160),
    title: z.string(),
    image: z.string().max(500).optional(),
    sample: z.boolean(),
    status: z.string().max(40).optional(),
    /** The record's own id, slug, code, key or IATA code, whichever it has. */
    values: z.record(z.string(), z.string()),
  })
  .strict();

export const ContentOptionsSchema = z.object({ items: z.array(ContentOptionSchema) }).strict();

/** Picker search: empty lists everything in admin order. */
export const ContentOptionsQuerySchema = z
  .object({ q: z.string().trim().max(80).optional() })
  .strict();

export type ContentHistoryEntry = z.infer<typeof ContentHistoryEntrySchema>;
export type ContentHistory = z.infer<typeof ContentHistorySchema>;
export type ContentRestoreInput = z.infer<typeof ContentRestoreInputSchema>;
export type ContentOption = z.infer<typeof ContentOptionSchema>;

export type InboxCountKey = z.infer<typeof InboxCountKeySchema>;
export type InboxItem = z.infer<typeof InboxItemSchema>;
export type InboxSummary = z.infer<typeof InboxSummarySchema>;
export type AdminSearchHit = z.infer<typeof AdminSearchHitSchema>;
export type AdminSearchResult = z.infer<typeof AdminSearchResultSchema>;

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
export type TrashListQuery = z.infer<typeof TrashListQuerySchema>;
export type ContentListQuery = z.infer<typeof ContentListQuerySchema>;
export type ContentBulkInput = z.infer<typeof ContentBulkInputSchema>;
export type StaffCreateInput = z.infer<typeof StaffCreateInputSchema>;
export type StaffUpdateInput = z.infer<typeof StaffUpdateInputSchema>;
export type ContentWriteInput = z.infer<typeof ContentWriteInputSchema>;
