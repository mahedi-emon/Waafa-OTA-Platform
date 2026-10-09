import { z } from "zod";
import {
  IdSchema,
  ImageSchema,
  IsoDateSchema,
  IsoDateTimeSchema,
  PublishStatusSchema,
  SampleFlagSchema,
  SeoSchema,
  SlugSchema,
  TakaSchema,
} from "./common";
import { PageSectionSchema } from "./content";
import { PrivateFileSchema } from "./leads";
import { VisaTypeKeySchema } from "./search";

export const VisaRegionSchema = z.enum([
  "south-asia",
  "south-east-asia",
  "middle-east",
  "east-asia",
  "europe",
  "americas",
  "oceania",
  "africa",
]);

export const VisaChecklistItemSchema = z
  .object({
    title: z.string().min(1).max(80),
    detail: z.string().min(1).max(300),
  })
  .strict();

/** One tab on the country page (FR-VISA-02). Tourist, business, student, medical and transit only. */
export const VisaTypeDetailSchema = z
  .object({
    type: VisaTypeKeySchema,
    processingTime: z.string().min(1).max(40),
    /** Stay, entry and validity are shown only once the visa desk has entered them from the embassy notice. */
    stay: z.string().min(1).max(40).optional(),
    entry: z.string().min(1).max(40).optional(),
    validity: z.string().min(1).max(60).optional(),
    checklist: z.array(VisaChecklistItemSchema).min(1),
    /** Paid to the embassy; null when it depends on the applicant and is confirmed later. */
    embassyFee: TakaSchema.nullable(),
    embassyFeeNote: z.string().max(120).optional(),
    serviceCharge: TakaSchema,
    notes: z.array(z.string().min(1).max(240)).default([]),
  })
  .strict();

export const VisaCountrySchema = z
  .object({
    id: IdSchema,
    slug: SlugSchema,
    name: z.string().min(1).max(60),
    /** ISO 3166-1 alpha-2 for the flag; "EU" for the Schengen area. */
    flagCode: z.string().regex(/^[A-Z]{2}$/),
    region: VisaRegionSchema,
    /** How the file is lodged, shown as a chip on the country card. */
    submission: z.enum(["embassy", "visa-centre", "evisa", "online", "interview", "on-arrival"]),
    popular: z.boolean().default(false),
    /** Real photo for the country card and page header; the card shows the flag alone without one. */
    cover: ImageSchema.optional(),
    types: z.array(VisaTypeDetailSchema).min(1),
    forms: z.array(z.object({ label: z.string().min(1), url: z.url() }).strict()).default([]),
    faqs: z
      .array(z.object({ question: z.string().min(1), answer: z.string().min(1) }).strict())
      .default([]),
    guideSlug: SlugSchema.optional(),
    status: PublishStatusSchema,
    seo: SeoSchema.default({ noIndex: false }),
    sample: SampleFlagSchema,
  })
  .strict()
  .refine(
    (country) => new Set(country.types.map((type) => type.type)).size === country.types.length,
    {
      message: "Each visa type appears once",
      path: ["types"],
    },
  );

/** Editorial visa guide per country, linked both ways with the service page (FR-VGD-01). */
export const VisaGuideSchema = z
  .object({
    id: IdSchema,
    slug: SlugSchema,
    countrySlug: SlugSchema,
    title: z.string().min(1).max(120),
    summary: z.string().min(1).max(300),
    cover: ImageSchema,
    /** Headed sections; their headings build the contents list. */
    sections: z.array(PageSectionSchema).min(1),
    tips: z.array(z.string().min(1).max(240)).default([]),
    updatedAt: IsoDateSchema,
    readingMinutes: z.number().int().positive(),
    status: PublishStatusSchema,
    seo: SeoSchema.default({ noIndex: false }),
    sample: SampleFlagSchema,
  })
  .strict();

/** FR-VISA-04 statuses; the customer gets an email on each change. */
export const VisaApplicationStatusSchema = z.enum([
  "new",
  "documents-pending",
  "documents-verified",
  "submitted-to-embassy",
  "approved",
  "rejected",
  "delivered",
  "cancelled",
]);

/** Admin pipeline record. Passport numbers never appear here; documents are private files (FR-VISA-05). */
export const VisaApplicationSchema = z
  .object({
    id: IdSchema,
    reference: z.string().regex(/^VSA-\d{6}-\d{4}$/),
    countrySlug: SlugSchema,
    visaType: VisaTypeKeySchema,
    applicantName: z.string().min(1).max(80),
    applicants: z.number().int().min(1).max(10),
    phone: z.string().regex(/^\+[1-9]\d{6,14}$/),
    travelDate: IsoDateSchema,
    status: VisaApplicationStatusSchema,
    documents: z.array(PrivateFileSchema).default([]),
    history: z
      .array(
        z
          .object({
            status: VisaApplicationStatusSchema,
            at: IsoDateTimeSchema,
            by: z.string().min(1),
          })
          .strict(),
      )
      .min(1),
    createdAt: IsoDateTimeSchema,
    /** Documents are deleted this many days after the case closes (configurable; FR-VISA-05 default 90). */
    retentionDays: z.number().int().positive().default(90),
    sample: SampleFlagSchema,
  })
  .strict();

export type VisaRegion = z.infer<typeof VisaRegionSchema>;
export type VisaChecklistItem = z.infer<typeof VisaChecklistItemSchema>;
export type VisaTypeDetail = z.infer<typeof VisaTypeDetailSchema>;
export type VisaCountry = z.infer<typeof VisaCountrySchema>;
export type VisaGuide = z.infer<typeof VisaGuideSchema>;
export type VisaApplicationStatus = z.infer<typeof VisaApplicationStatusSchema>;
export type VisaApplication = z.infer<typeof VisaApplicationSchema>;
