import { z } from "zod";
import { IsoDateSchema, IsoDateTimeSchema, SlugSchema, TakaSchema } from "./common";
import { CabinClassSchema, IataSchema } from "./travel";

export const MAX_TRAVELLERS = 9;
export const MAX_MULTI_CITY_LEGS = 5;
export const MAX_HOTEL_NIGHTS = 30;
export const MAX_HOTEL_ROOMS = 5;

/** Days between two ISO dates (b - a), in whole days. */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

export const TravellersSchema = z
  .object({
    adults: z.number().int().min(1).max(MAX_TRAVELLERS),
    /** One age (2 to 11) per child (FR-SRCH-02). */
    childAges: z.array(z.number().int().min(2).max(11)).max(MAX_TRAVELLERS - 1),
    infants: z.number().int().min(0).max(MAX_TRAVELLERS),
  })
  .strict()
  .superRefine((value, ctx) => {
    const total = value.adults + value.childAges.length + value.infants;
    if (total > MAX_TRAVELLERS) {
      ctx.addIssue({
        code: "custom",
        message: `Up to ${MAX_TRAVELLERS} travellers per search`,
        path: ["adults"],
      });
    }
    if (value.infants > value.adults) {
      ctx.addIssue({
        code: "custom",
        message: "Infants can’t outnumber adults",
        path: ["infants"],
      });
    }
  });

export const FlightLegSchema = z
  .object({
    from: IataSchema,
    to: IataSchema,
    date: IsoDateSchema,
  })
  .strict()
  .refine((leg) => leg.from !== leg.to, { message: "From and To must be different", path: ["to"] });

export const FlightSearchSchema = z
  .object({
    tripType: z.enum(["one-way", "round-trip", "multi-city"]),
    legs: z.array(FlightLegSchema).min(1).max(MAX_MULTI_CITY_LEGS),
    returnDate: IsoDateSchema.optional(),
    travellers: TravellersSchema,
    cabin: CabinClassSchema,
    preferredAirline: z
      .string()
      .regex(/^[A-Z0-9]{2}$/)
      .optional(),
    directOnly: z.boolean().default(false),
    flexibleDates: z.boolean().default(false),
    fareType: z.enum(["regular", "student"]).default("regular"),
  })
  .strict()
  .superRefine((search, ctx) => {
    if (search.tripType !== "multi-city" && search.legs.length !== 1) {
      ctx.addIssue({
        code: "custom",
        message: "One leg for one-way and round-trip searches",
        path: ["legs"],
      });
    }
    if (search.tripType === "multi-city" && search.legs.length < 2) {
      ctx.addIssue({ code: "custom", message: "Add at least two flights", path: ["legs"] });
    }
    const first = search.legs[0];
    if (search.tripType === "round-trip") {
      if (!search.returnDate) {
        ctx.addIssue({ code: "custom", message: "Pick a return date", path: ["returnDate"] });
      } else if (first && daysBetween(first.date, search.returnDate) < 0) {
        ctx.addIssue({
          code: "custom",
          message: "Return must be on or after departure",
          path: ["returnDate"],
        });
      }
    }
    for (let index = 1; index < search.legs.length; index += 1) {
      const previous = search.legs[index - 1];
      const leg = search.legs[index];
      if (previous && leg && daysBetween(previous.date, leg.date) < 0) {
        ctx.addIssue({
          code: "custom",
          message: "Each flight must be on or after the one before",
          path: ["legs", index, "date"],
        });
      }
    }
  });

export const HotelRoomSchema = z
  .object({
    adults: z.number().int().min(1).max(6),
    childAges: z.array(z.number().int().min(0).max(17)).max(4),
  })
  .strict();

export const HotelSearchSchema = z
  .object({
    placeId: z.string().min(1),
    placeLabel: z.string().min(1),
    checkIn: IsoDateSchema,
    checkOut: IsoDateSchema,
    rooms: z.array(HotelRoomSchema).min(1).max(MAX_HOTEL_ROOMS),
    nationality: z
      .string()
      .regex(/^[A-Z]{2}$/)
      .default("BD"),
  })
  .strict()
  .superRefine((search, ctx) => {
    const nights = daysBetween(search.checkIn, search.checkOut);
    if (nights < 1) {
      ctx.addIssue({
        code: "custom",
        message: "Check-out must be after check-in",
        path: ["checkOut"],
      });
    } else if (nights > MAX_HOTEL_NIGHTS) {
      ctx.addIssue({
        code: "custom",
        message: `Up to ${MAX_HOTEL_NIGHTS} nights per booking`,
        path: ["checkOut"],
      });
    }
  });

export const TourSearchSchema = z
  .object({
    query: z.string().max(80).default(""),
    /** Travel month "2026-11", optional. */
    month: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
      .optional(),
    travellers: z.number().int().min(1).max(40).default(2),
    budget: TakaSchema.optional(),
  })
  .strict();

export const VisaTypeKeySchema = z.enum(["tourist", "business", "student", "medical", "transit"]);

export const VisaSearchSchema = z
  .object({
    country: SlugSchema,
    nationality: z
      .string()
      .regex(/^[A-Z]{2}$/)
      .default("BD"),
    visaType: VisaTypeKeySchema.default("tourist"),
  })
  .strict();

/** Every submitted search, logged asynchronously (FR-SRCH-10). */
export const SearchLogSchema = z
  .object({
    id: z.string().min(1),
    module: z.enum(["flights", "hotels", "packages", "visa"]),
    summary: z.string().min(1),
    params: z.record(z.string(), z.unknown()),
    device: z.enum(["phone", "tablet", "desktop"]),
    source: z.string().min(1),
    createdAt: IsoDateTimeSchema,
    convertedLeadReference: z.string().optional(),
    sample: z.boolean(),
  })
  .strict();

/** What the search card sends when a search is submitted; the server adds the id and the time. */
export const SearchLogInputSchema = z
  .object({
    module: SearchLogSchema.shape.module,
    summary: z.string().min(1).max(160),
    params: z
      .record(z.string().max(40), z.union([z.string().max(600), z.number(), z.boolean()]))
      .refine((params) => Object.keys(params).length <= 24, { message: "Too many parameters" }),
    device: SearchLogSchema.shape.device,
    source: z.string().min(1).max(120),
  })
  .strict();

export type Travellers = z.infer<typeof TravellersSchema>;
export type FlightLeg = z.infer<typeof FlightLegSchema>;
export type FlightSearch = z.infer<typeof FlightSearchSchema>;
export type HotelRoom = z.infer<typeof HotelRoomSchema>;
export type HotelSearch = z.infer<typeof HotelSearchSchema>;
export type TourSearch = z.infer<typeof TourSearchSchema>;
export type VisaTypeKey = z.infer<typeof VisaTypeKeySchema>;
export type VisaSearch = z.infer<typeof VisaSearchSchema>;
export type SearchLog = z.infer<typeof SearchLogSchema>;
export type SearchLogInput = z.infer<typeof SearchLogInputSchema>;
