import { z } from "zod";
import {
  EmailSchema,
  IdSchema,
  IsoDateSchema,
  IsoDateTimeSchema,
  SampleFlagSchema,
  TakaSchema,
} from "./common";
import { FlightSearchSchema, HotelSearchSchema, VisaTypeKeySchema } from "./search";
import { RoomSharingSchema } from "./travel";

/** Every lead module and its reference prefix (FR-FLT-05, FR-PKG-06/07, FR-VISA-03, FR-SHOP-11/12, FR-PAGE). */
export const LeadModuleSchema = z.enum([
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
]);

export const LEAD_PREFIX = {
  flights: "FLT",
  hotels: "HTL",
  packages: "PKG",
  "plan-trip": "CTR",
  visa: "VSA",
  printing: "PRN",
  trading: "TRD",
  contact: "CNT",
  emi: "EMI",
  bulk: "QTE",
} as const satisfies Record<z.infer<typeof LeadModuleSchema>, string>;

/** FR-ADM-LEAD statuses. Booked needs an amount; Cancelled and Lost need a reason. */
export const LeadStatusSchema = z.enum([
  "new",
  "pending",
  "in-progress",
  "quoted",
  "booked",
  "cancelled",
  "lost",
  "spam",
]);

export const LeadPrioritySchema = z.enum(["low", "normal", "high", "urgent"]);

export const PreferredContactSchema = z.enum(["call", "whatsapp", "email"]);

export const LeadContactSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(80),
    /** E.164; the form defaults the country to +880 (FR-FLT-02). */
    phone: z.string().regex(/^\+[1-9]\d{6,14}$/, "Enter a valid phone number"),
    email: EmailSchema.optional(),
    preferredContact: PreferredContactSchema.default("call"),
    bestTime: z.string().max(40).optional(),
  })
  .strict();

const TravellerCountsSchema = z
  .object({
    adults: z.number().int().min(1).max(40),
    children: z.number().int().min(0).max(20),
    infants: z.number().int().min(0).max(20),
  })
  .strict();

const notes = z.string().trim().max(1000).optional();

/** "Your preferences" rail on /flights (FR-FLT-03): optional, sent to the travel expert with the request. */
export const FlightPreferencesSchema = z
  .object({
    stops: z.enum(["any", "direct", "one"]).default("any"),
    times: z
      .array(z.enum(["morning", "afternoon", "evening", "night"]))
      .max(4)
      .default([]),
    airlines: z
      .array(z.string().regex(/^[A-Z0-9]{2}$/))
      .max(12)
      .default([]),
    bag: z.enum(["any", "20", "30"]).default("any"),
    refundableOnly: z.boolean().default(false),
  })
  .strict();

export const FlightLeadPayloadSchema = z
  .object({
    module: z.literal("flights"),
    search: FlightSearchSchema,
    groupFareId: IdSchema.optional(),
    preferences: FlightPreferencesSchema.optional(),
    notes,
  })
  .strict();

/** Hotel request extras (Hotels-2): budget band, meals and the two preferences from the rail. */
export const HotelBudgetBandSchema = z.enum([
  "any",
  "under-5000",
  "5000-10000",
  "10000-20000",
  "over-20000",
]);
export const HotelMealsSchema = z.enum(["any", "room-only", "breakfast", "half-board"]);

export const HotelLeadPayloadSchema = z
  .object({
    module: z.literal("hotels"),
    search: HotelSearchSchema,
    starPreference: z.enum(["any", "3", "4", "5"]).default("any"),
    budgetPerNight: TakaSchema.optional(),
    budgetBand: HotelBudgetBandSchema.default("any"),
    meals: HotelMealsSchema.default("any"),
    seaView: z.boolean().default(false),
    freeCancellation: z.boolean().default(false),
    notes,
  })
  .strict();

export const PackageLeadPayloadSchema = z
  .object({
    module: z.literal("packages"),
    packageId: IdSchema,
    packageTitle: z.string().min(1),
    /** A fixed departure date, or "any" for a private trip on the same plan. */
    departure: z.union([IsoDateSchema, z.literal("any")]),
    travellers: TravellerCountsSchema,
    roomSharing: RoomSharingSchema,
    notes,
  })
  .strict();

export const PlanTripLeadPayloadSchema = z
  .object({
    module: z.literal("plan-trip"),
    destinations: z.array(z.string().trim().min(1).max(60)).min(1).max(6),
    startDate: IsoDateSchema.optional(),
    month: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
      .optional(),
    nights: z.number().int().min(1).max(60),
    travellers: TravellerCountsSchema,
    budgetPerPerson: TakaSchema.optional(),
    /** Budget per person as the board's bands (PlanTrip): under 30k, 30–60k, 60k–1 lakh, over 1 lakh. */
    budgetBand: z
      .enum(["any", "under-30000", "30000-60000", "60000-100000", "over-100000"])
      .default("any"),
    hotelClass: z.enum(["any", "3", "4", "5", "resort"]).default("any"),
    /** Who the trip is for (PlanTrip "This trip is for"). */
    tripFor: z.enum(["family", "couple", "friends", "solo", "office"]).optional(),
    interests: z.array(z.string().min(1).max(30)).max(10).default([]),
    includeFlights: z.boolean().default(true),
    visaHelp: z.boolean().default(false),
    notes,
  })
  .strict()
  .refine((value) => Boolean(value.startDate) || Boolean(value.month), {
    message: "Pick a start date or a month",
    path: ["month"],
  });

/** Uploaded document reference. Files live in a private bucket; only signed links reach staff (FR-VISA-05). */
export const PrivateFileSchema = z
  .object({
    kind: z.enum(["passport-bio", "photo", "bank-statement", "invitation", "other"]),
    fileName: z.string().min(1).max(120),
    mimeType: z.enum(["image/jpeg", "image/png", "application/pdf"]),
    sizeBytes: z
      .number()
      .int()
      .positive()
      .max(5 * 1024 * 1024, "Files can be up to 5 MB"),
    storageKey: z.string().min(1).optional(),
  })
  .strict();

export const VisaLeadPayloadSchema = z
  .object({
    module: z.literal("visa"),
    countrySlug: z.string().min(1),
    countryName: z.string().min(1),
    visaType: VisaTypeKeySchema,
    applicants: z.number().int().min(1).max(10),
    travelDate: IsoDateSchema,
    appointmentDate: IsoDateSchema.optional(),
    appointmentWindow: z.enum(["morning", "afternoon"]).optional(),
    documents: z.array(PrivateFileSchema).max(20).default([]),
    notes,
  })
  .strict();

export const PrintingLeadPayloadSchema = z
  .object({
    module: z.literal("printing"),
    company: z.string().trim().min(1).max(120),
    service: z.enum([
      "managed-printing",
      "toner-supply",
      "printer-repair",
      "bulk-printing",
      "other",
    ]),
    volume: z.string().trim().min(1).max(80),
    frequency: z.enum(["one-off", "weekly", "monthly", "quarterly"]),
    location: z.string().trim().min(1).max(120),
    attachments: z.array(PrivateFileSchema).max(5).default([]),
    notes,
  })
  .strict();

export const TradingLeadPayloadSchema = z
  .object({
    module: z.literal("trading"),
    company: z.string().trim().min(1).max(120),
    direction: z.enum(["import", "export", "sourcing"]),
    country: z.string().trim().min(1).max(60),
    product: z.string().trim().min(1).max(120),
    specifications: z.string().trim().min(1).max(2000),
    quantity: z.number().positive(),
    unit: z.string().trim().min(1).max(20),
    targetPrice: z.string().max(60).optional(),
    deliveryTerms: z.enum(["exw", "fob", "cif", "ddp", "other"]).optional(),
    timeline: z.string().trim().min(1).max(80),
    attachments: z.array(PrivateFileSchema).max(5).default([]),
    notes,
  })
  .strict();

export const ContactLeadPayloadSchema = z
  .object({
    module: z.literal("contact"),
    topic: z.enum(["flights", "packages", "visa", "shop", "printing", "trading", "other"]),
    message: z.string().trim().min(10, "Tell us a little more").max(2000),
  })
  .strict();

export const EmiLeadPayloadSchema = z
  .object({
    module: z.literal("emi"),
    bank: z.string().min(1).max(80),
    amount: TakaSchema,
    tenureMonths: z.number().int().positive().max(36),
    notes,
  })
  .strict();

/** Corporate and bulk quote from Waafas World (Shop-bulk, ShopProduct-bulk): QTE reference. */
export const BulkLeadPayloadSchema = z
  .object({
    module: z.literal("bulk"),
    company: z.string().trim().min(1).max(120),
    items: z.string().trim().min(3).max(2000),
    productSlug: z.string().max(120).optional(),
    attachment: PrivateFileSchema.optional(),
  })
  .strict();

export const LeadPayloadSchema = z.discriminatedUnion("module", [
  FlightLeadPayloadSchema,
  HotelLeadPayloadSchema,
  PackageLeadPayloadSchema,
  PlanTripLeadPayloadSchema,
  VisaLeadPayloadSchema,
  PrintingLeadPayloadSchema,
  TradingLeadPayloadSchema,
  ContactLeadPayloadSchema,
  EmiLeadPayloadSchema,
  BulkLeadPayloadSchema,
]);

export const LeadSourceSchema = z
  .object({
    channel: z.enum(["web", "whatsapp", "phone", "walk-in", "facebook"]),
    page: z.string().max(200).optional(),
    utm: z
      .object({
        source: z.string().optional(),
        medium: z.string().optional(),
        campaign: z.string().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

/** What a public form submits (with an Idempotency-Key header, Turnstile token and consent). */
export const LeadCreateInputSchema = z
  .object({
    contact: LeadContactSchema,
    payload: LeadPayloadSchema,
    consent: z.literal(true, { message: "Please agree to be contacted about this request" }),
    source: LeadSourceSchema.default({ channel: "web" }),
  })
  .strict();

export const LeadCreatedSchema = z
  .object({
    reference: z.string().regex(/^[A-Z]{3}-\d{6}-\d{4}$/),
    createdAt: IsoDateTimeSchema,
  })
  .strict();

export const LeadActivitySchema = z
  .object({
    id: IdSchema,
    type: z.enum(["created", "note", "status", "assign", "call", "email", "whatsapp", "converted"]),
    body: z.string().min(1).max(2000),
    actor: z.string().min(1).max(80),
    createdAt: IsoDateTimeSchema,
  })
  .strict();

export const LeadSchema = z
  .object({
    id: IdSchema,
    reference: z.string().regex(/^[A-Z]{3}-\d{6}-\d{4}$/),
    module: LeadModuleSchema,
    status: LeadStatusSchema,
    priority: LeadPrioritySchema,
    contact: LeadContactSchema,
    payload: LeadPayloadSchema,
    source: LeadSourceSchema,
    /** One-line trip summary for tables, e.g. "DAC → DXB · 14 Nov · 2 adults". */
    summary: z.string().min(1).max(140),
    travelDate: IsoDateSchema.optional(),
    travellers: z.number().int().min(0).optional(),
    assigneeId: IdSchema.optional(),
    amount: TakaSchema.optional(),
    reason: z.string().max(300).optional(),
    duplicateOf: z.string().optional(),
    activities: z.array(LeadActivitySchema).default([]),
    createdAt: IsoDateTimeSchema,
    firstResponseAt: IsoDateTimeSchema.optional(),
    closedAt: IsoDateTimeSchema.optional(),
    sample: SampleFlagSchema,
  })
  .strict()
  .superRefine((lead, ctx) => {
    if (lead.payload.module !== lead.module) {
      ctx.addIssue({
        code: "custom",
        message: "Payload module must match the lead module",
        path: ["payload"],
      });
    }
    if (lead.status === "booked" && lead.amount === undefined) {
      ctx.addIssue({ code: "custom", message: "Booked leads need an amount", path: ["amount"] });
    }
    if ((lead.status === "cancelled" || lead.status === "lost") && !lead.reason) {
      ctx.addIssue({
        code: "custom",
        message: "Cancelled and lost leads need a reason",
        path: ["reason"],
      });
    }
  });

export type LeadModule = z.infer<typeof LeadModuleSchema>;
export type LeadStatus = z.infer<typeof LeadStatusSchema>;
export type LeadPriority = z.infer<typeof LeadPrioritySchema>;
export type PreferredContact = z.infer<typeof PreferredContactSchema>;
export type LeadContact = z.infer<typeof LeadContactSchema>;
export type PrivateFile = z.infer<typeof PrivateFileSchema>;
export type LeadPayload = z.infer<typeof LeadPayloadSchema>;
export type LeadSource = z.infer<typeof LeadSourceSchema>;
export type LeadCreateInput = z.infer<typeof LeadCreateInputSchema>;
export type LeadCreated = z.infer<typeof LeadCreatedSchema>;
export type FlightPreferences = z.infer<typeof FlightPreferencesSchema>;
export type LeadActivity = z.infer<typeof LeadActivitySchema>;
export type Lead = z.infer<typeof LeadSchema>;
