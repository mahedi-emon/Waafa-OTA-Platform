import { z } from "zod";
import { IdSchema, IsoDateTimeSchema } from "./common";

/** A follow-up a staff member sets for themselves (issue 243), on a lead or on its own. */
export const ReminderInputSchema = z
  .object({
    leadId: IdSchema.optional(),
    note: z.string().trim().min(1).max(500),
    dueAt: IsoDateTimeSchema,
  })
  .strict();

/** Done, or a new due time (snooze). */
export const ReminderUpdateInputSchema = z
  .object({
    done: z.literal(true).optional(),
    dueAt: IsoDateTimeSchema.optional(),
  })
  .strict()
  .refine((value) => value.done !== undefined || value.dueAt !== undefined, {
    message: "Nothing to change",
  });

export const ReminderListQuerySchema = z.object({ leadId: IdSchema.optional() }).strict();

export const ReminderViewSchema = z
  .object({
    id: IdSchema,
    note: z.string(),
    dueAt: IsoDateTimeSchema,
    /** Overdue (past), today (later today in Dhaka) or later. */
    when: z.enum(["overdue", "today", "later"]),
    lead: z.object({ id: IdSchema, reference: z.string(), name: z.string() }).nullable(),
  })
  .strict();

export const ReminderListSchema = z.object({ items: z.array(ReminderViewSchema) }).strict();

/** One thing in the bell for one person: someone mentioned them, a reminder fell due, a lead was handed to them. */
export const StaffAlertViewSchema = z
  .object({
    id: IdSchema,
    kind: z.enum(["mention", "reminder", "assigned"]),
    title: z.string().min(1).max(160),
    detail: z.string().max(300),
    href: z.string().max(300),
    read: z.boolean(),
    at: IsoDateTimeSchema,
  })
  .strict();

export const StaffAlertReadInputSchema = z
  .object({ ids: z.array(IdSchema).max(100).optional(), all: z.literal(true).optional() })
  .strict()
  .refine((value) => value.all === true || (value.ids?.length ?? 0) > 0, {
    message: "Say which alerts were read",
  });

/**
 * What the real-time stream sends (issue 243): something arrived (a lead, an order, a payment proof) or a personal
 * alert. The admin plays the chime and reloads the bell and badges; the data itself comes from GET /admin/inbox.
 */
export const LiveEventSchema = z
  .object({
    type: z.enum(["lead", "order", "proof", "alert"]),
    title: z.string().max(160),
    detail: z.string().max(300),
    href: z.string().max(300),
    at: IsoDateTimeSchema,
  })
  .strict();

export type ReminderInput = z.infer<typeof ReminderInputSchema>;
export type ReminderUpdateInput = z.infer<typeof ReminderUpdateInputSchema>;
export type ReminderView = z.infer<typeof ReminderViewSchema>;
export type ReminderList = z.infer<typeof ReminderListSchema>;
export type StaffAlertView = z.infer<typeof StaffAlertViewSchema>;
export type StaffAlertReadInput = z.infer<typeof StaffAlertReadInputSchema>;
export type LiveEvent = z.infer<typeof LiveEventSchema>;
