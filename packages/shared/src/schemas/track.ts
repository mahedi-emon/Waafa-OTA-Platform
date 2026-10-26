import { z } from "zod";
import { IsoDateSchema, IsoDateTimeSchema } from "./common";
import { LeadModuleSchema, LeadStatusSchema } from "./leads";
import { OrderSchema } from "./shop";

/*
 * One /track page (issue 240, FR-VISA-06, FR-SHOP-09): any request, visa application or order by its reference and the
 * phone on it. A request answers with its status and the dates of each step only: no name, contact or trip details.
 * A wrong phone and an unknown reference get the same "not found".
 */

export const TrackInputSchema = z
  .object({
    reference: z.string().trim().toUpperCase().min(6).max(40),
    phone: z.string().trim().min(6).max(40),
  })
  .strict();
export type TrackInput = z.infer<typeof TrackInputSchema>;

export const VISA_TRACK_STAGES = [
  "documentsPending",
  "readyToSubmit",
  "submitted",
  "approved",
  "rejected",
  "passportReturned",
  "cancelled",
] as const;

export const TrackedRequestSchema = z
  .object({
    kind: z.literal("request"),
    reference: z.string(),
    module: LeadModuleSchema,
    status: LeadStatusSchema,
    createdAt: IsoDateTimeSchema,
    /** When a travel expert first replied. */
    respondedAt: IsoDateTimeSchema.nullable(),
    /** When it was booked, cancelled or closed. */
    closedAt: IsoDateTimeSchema.nullable(),
    /** A visa application's steps; null for every other request. */
    visa: z
      .object({
        stage: z.enum(VISA_TRACK_STAGES),
        received: z.number().int().min(0),
        required: z.number().int().min(0),
        submittedOn: IsoDateSchema.nullable(),
        passportReturnedOn: IsoDateSchema.nullable(),
      })
      .strict()
      .nullable(),
  })
  .strict();
export type TrackedRequest = z.infer<typeof TrackedRequestSchema>;

export const TrackResultSchema = z.discriminatedUnion("kind", [
  TrackedRequestSchema,
  z.object({ kind: z.literal("order"), order: OrderSchema }).strict(),
]);
export type TrackResult = z.infer<typeof TrackResultSchema>;
