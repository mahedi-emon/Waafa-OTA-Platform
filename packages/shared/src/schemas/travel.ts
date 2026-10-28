import { z } from "zod";
import { CABIN_CLASSES } from "../constants";
import {
  IdSchema,
  ImageSchema,
  IsoDateSchema,
  IsoDateTimeSchema,
  PublishStatusSchema,
  PublishTimesShape,
  SampleFlagSchema,
  SeoSchema,
  SlugSchema,
  TakaSchema,
  VideoSchema,
} from "./common";

export const IataSchema = z.string().regex(/^[A-Z]{3}$/, "Three-letter airport code");
export const AirlineCodeSchema = z.string().regex(/^[A-Z0-9]{2}$/, "Two-character airline code");

/** Seeded airport dataset for autocomplete (FR-SRCH-06). `pinnedRank` orders the pinned list. */
export const AirportSchema = z
  .object({
    iata: IataSchema,
    city: z.string().min(1),
    name: z.string().min(1),
    country: z.string().min(1),
    countryCode: z.string().regex(/^[A-Z]{2}$/),
    pinnedRank: z.number().int().positive().optional(),
  })
  .strict();

export const AirlineSchema = z
  .object({
    code: AirlineCodeSchema,
    name: z.string().min(1),
    /** Position in the Home airline strip; airlines without it are not shown there. */
    featuredOrder: z.number().int().min(0).optional(),
    /**
     * Logo uploaded in Admin (Media library address). Leave empty: the site shows the bundled logo for the code, or the
     * code itself when there is none (issue 156).
     */
    logo: ImageSchema.optional(),
  })
  .strict();

export const CabinClassSchema = z.enum(CABIN_CLASSES);

/** Admin-managed group and special fares (FR-FLT-07). Always labelled indicative; hidden after expiry. */
export const GroupFareSchema = z
  .object({
    id: IdSchema,
    airline: AirlineSchema,
    cabin: CabinClassSchema,
    baggage: z.string().min(1).max(60),
    tripType: z.enum(["one-way", "return"]),
    from: z.object({ iata: IataSchema, city: z.string().min(1) }).strict(),
    to: z.object({ iata: IataSchema, city: z.string().min(1) }).strict(),
    stops: z.number().int().min(0).max(3),
    departDate: IsoDateSchema,
    returnDate: IsoDateSchema.optional(),
    /** Seats left, only as entered by staff (never invented urgency). */
    seatsLeft: z.number().int().min(0).optional(),
    farePerAdult: TakaSchema,
    expiresAt: IsoDateTimeSchema,
    notes: z.string().max(200).optional(),
    sample: SampleFlagSchema,
  })
  .strict()
  .refine((fare) => fare.tripType === "one-way" || Boolean(fare.returnDate), {
    message: "Return fares need a return date",
    path: ["returnDate"],
  });

/** Package categories (FR-PKG-01). There is no Hajj or Umrah category. */
export const PackageCategorySchema = z.enum([
  "domestic",
  "international",
  "group-tours",
  "honeymoon",
  "family",
  "corporate",
  "cruise",
]);

export const PackageTagSchema = z.enum([
  "best-seller",
  "featured",
  "group-departure",
  "visa-help",
  "new",
]);

export const ItineraryDaySchema = z
  .object({
    day: z.number().int().positive(),
    title: z.string().min(1).max(80),
    body: z.string().min(1).max(600),
    /** Short chips under the day, e.g. "Breakfast", "Guide", "Domestic flight". */
    tags: z.array(z.string().min(1).max(30)).default([]),
  })
  .strict();

export const RoomSharingSchema = z.enum([
  "twin",
  "triple",
  "single",
  "child-with-bed",
  "child-without-bed",
  "infant",
]);

export const PackagePriceSchema = z
  .object({
    sharing: RoomSharingSchema,
    label: z.string().min(1).max(40),
    detail: z.string().min(1).max(60),
    price: TakaSchema,
  })
  .strict();

export const PackageDepartureSchema = z
  .object({
    date: IsoDateSchema,
    seatsLeft: z.number().int().min(0).optional(),
  })
  .strict();

export const PackageHotelSchema = z
  .object({
    city: z.string().min(1).max(60),
    description: z.string().min(1).max(120),
    nightsLabel: z.string().min(1).max(40),
    image: ImageSchema.optional(),
    nameNote: z.string().max(80).optional(),
  })
  .strict();

export const TourPackageSchema = z
  .object({
    id: IdSchema,
    slug: SlugSchema,
    title: z.string().min(1).max(100),
    summary: z.string().min(1).max(400),
    /** Card line such as "Istanbul · Cappadocia". */
    placesLabel: z.string().min(1).max(80),
    countries: z.array(z.string().min(1)).min(1),
    destinationSlug: SlugSchema,
    /** A trip can sit in several categories, e.g. International and Honeymoon (FR-PKG-01). */
    categories: z.array(PackageCategorySchema).min(1),
    tags: z.array(PackageTagSchema).default([]),
    /** Months the trip runs ("2026-11"), for the Travel month filter (FR-PKG-02). */
    months: z.array(z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)).default([]),
    durationDays: z.number().int().positive(),
    durationNights: z.number().int().min(0),
    nightsPerCity: z.array(
      z.object({ city: z.string().min(1), nights: z.number().int().positive() }).strict(),
    ),
    /** Chips on the card, e.g. "Flights", "Hotel", "Breakfast". */
    includesShort: z.array(z.string().min(1).max(20)).max(4),
    cover: ImageSchema,
    gallery: z.array(ImageSchema).default([]),
    video: VideoSchema.optional(),
    groupSize: z.string().max(40).optional(),
    visaNote: z.string().max(60).optional(),
    /** From price per person on twin sharing (FR-PKG-03), always indicative before confirmation. */
    fromPrice: TakaSchema,
    highlights: z.array(
      z.object({ title: z.string().min(1).max(40), detail: z.string().min(1).max(80) }).strict(),
    ),
    itinerary: z.array(ItineraryDaySchema).min(1),
    inclusions: z.array(z.string().min(1).max(160)),
    exclusions: z.array(z.string().min(1).max(160)),
    prices: z.array(PackagePriceSchema).min(1),
    departures: z.array(PackageDepartureSchema).default([]),
    /** "Any date" private trips with the same plan (FR-PKG-04). */
    anyDate: z.boolean(),
    hotels: z.array(PackageHotelSchema).default([]),
    visa: z
      .object({
        needed: z.boolean(),
        title: z.string().min(1).max(80),
        body: z.string().min(1).max(400),
        countrySlug: SlugSchema.optional(),
      })
      .strict()
      .optional(),
    terms: z.array(z.string().min(1).max(240)).default([]),
    faqs: z
      .array(z.object({ question: z.string().min(1), answer: z.string().min(1) }).strict())
      .default([]),
    relatedSlugs: z.array(SlugSchema).default([]),
    popularity: z.number().int().min(0),
    publishedAt: IsoDateSchema,
    status: PublishStatusSchema,
    ...PublishTimesShape,
    seo: SeoSchema.default({ noIndex: false }),
    sample: SampleFlagSchema,
  })
  .strict()
  .refine((pkg) => pkg.itinerary.length === pkg.durationDays, {
    message: "The itinerary needs one entry per day",
    path: ["itinerary"],
  });

/** Hotel search autocomplete: a city or a named hotel (FR-SRCH-03). */
export const HotelPlaceSchema = z
  .object({
    id: IdSchema,
    kind: z.enum(["city", "hotel"]),
    name: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(1),
    popular: z.boolean().default(false),
  })
  .strict();

/** What a curated hotel offers (FR-HTL-02); the site shows each with its own icon and words. */
export const HOTEL_AMENITIES = [
  "wifi",
  "breakfast",
  "pool",
  "beach",
  "sea-view",
  "spa",
  "gym",
  "restaurant",
  "room-service",
  "air-conditioning",
  "parking",
  "airport-transfer",
  "family-rooms",
  "prayer-room",
] as const;
export const HotelAmenitySchema = z.enum(HOTEL_AMENITIES);

/** A room type at a curated hotel with its "from" price per night (taka, VAT included, indicative). */
export const HotelRoomTypeSchema = z
  .object({
    id: IdSchema,
    name: z.string().min(1).max(60),
    /** e.g. "1 king bed" or "2 twin beds". */
    beds: z.string().min(1).max(60),
    sleeps: z.number().int().min(1).max(10),
    /** e.g. "32 m²". */
    size: z.string().max(20).optional(),
    fromPrice: TakaSchema,
    features: z.array(z.string().min(1).max(40)).max(6).default([]),
    image: ImageSchema.optional(),
  })
  .strict();

/**
 * Curated hotels (FR-HTL-02, issue 249): properties the team recommends, with photos, amenities, room types and
 * "from" prices per night. Prices are indicative; "Request booking" sends a hotel request that an expert confirms.
 */
export const HotelSchema = z
  .object({
    id: IdSchema,
    slug: SlugSchema,
    name: z.string().min(1).max(80),
    city: z.string().min(1).max(60),
    country: z.string().min(1).max(60),
    /** The neighbourhood or beach, e.g. "Kolatoli, Cox's Bazar". */
    area: z.string().max(80).optional(),
    stars: z.number().int().min(1).max(5),
    /** The hotel search's place for its city, so a request starts there. */
    placeId: IdSchema.optional(),
    summary: z.string().min(1).max(200),
    description: z.array(z.string().min(1).max(800)).min(1).max(6),
    cover: ImageSchema,
    gallery: z.array(ImageSchema).max(12).default([]),
    amenities: z.array(HotelAmenitySchema).default([]),
    rooms: z.array(HotelRoomTypeSchema).min(1).max(10),
    checkIn: z.string().max(20).optional(),
    checkOut: z.string().max(20).optional(),
    order: z.number().int().min(0).default(0),
    status: PublishStatusSchema,
    ...PublishTimesShape,
    seo: SeoSchema.default({ noIndex: false }),
    sample: SampleFlagSchema,
  })
  .strict()
  .superRefine((hotel, ctx) => {
    if (new Set(hotel.rooms.map((room) => room.id)).size !== hotel.rooms.length) {
      ctx.addIssue({ code: "custom", message: "Room types need different ids", path: ["rooms"] });
    }
  });

/* ---------- Normalised models for Live mode (FR-GS-08). The UI renders only these. ---------- */

export const BaggageAllowanceSchema = z
  .object({
    cabin: z.string().min(1),
    checked: z.string().min(1),
  })
  .strict();

export const SegmentSchema = z
  .object({
    marketingCarrier: AirlineSchema,
    flightNumber: z.string().min(1).max(8),
    from: IataSchema,
    to: IataSchema,
    departAt: IsoDateTimeSchema,
    arriveAt: IsoDateTimeSchema,
    durationMinutes: z.number().int().positive(),
    aircraft: z.string().optional(),
    cabin: CabinClassSchema,
  })
  .strict();

/**
 * A flight route landing page (/flights/dhaka-to-dubai), managed in Admin › Content › Flight routes. Built for
 * search: the facts a traveller looks up (flight time, airlines, best time, tips, questions), the indicative
 * "from" fare and the fixed-date group fares on the route. Never a live price or availability.
 */
export const FlightRouteSchema = z
  .object({
    slug: SlugSchema,
    from: IataSchema,
    to: IataSchema,
    /** The page heading, e.g. "Dhaka to Dubai flights". */
    title: z.string().min(1).max(80),
    intro: z.string().min(1).max(320),
    image: ImageSchema,
    /** e.g. "About 5 hours non-stop". */
    flightTime: z.string().min(1).max(40),
    /** Airlines that usually fly the route (codes from the airline list). */
    airlineCodes: z.array(AirlineCodeSchema).max(12).default([]),
    /** Indicative lowest fare per adult, labelled indicative and confirmed by an expert. */
    fromPrice: TakaSchema.optional(),
    bestTime: z.string().min(1).max(160).optional(),
    tips: z
      .array(
        z.object({ title: z.string().min(1).max(60), body: z.string().min(1).max(280) }).strict(),
      )
      .max(6)
      .default([]),
    faqs: z
      .array(
        z
          .object({ question: z.string().min(1).max(140), answer: z.string().min(1).max(600) })
          .strict(),
      )
      .max(10)
      .default([]),
    /** Links the destination's visa page when there is one. */
    visaCountrySlug: SlugSchema.optional(),
    /** Listed under "Popular routes" on the flights page and in the footer of other routes. */
    popular: z.boolean().default(false),
    order: z.number().int().min(0).default(0),
    status: PublishStatusSchema,
    ...PublishTimesShape,
    seo: SeoSchema.default({ noIndex: false }),
    sample: SampleFlagSchema,
  })
  .strict()
  .refine((route) => route.from !== route.to, {
    message: "From and to must be different airports",
    path: ["to"],
  });

export const FareBreakdownSchema = z
  .object({
    passengerType: z.enum(["adult", "child", "infant"]),
    count: z.number().int().positive(),
    baseFare: TakaSchema,
    taxes: TakaSchema,
    total: TakaSchema,
  })
  .strict();

export const FareRuleSchema = z
  .object({
    kind: z.enum(["change", "cancel", "no-show", "baggage", "other"]),
    text: z.string().min(1),
  })
  .strict();

export const FlightOfferSchema = z
  .object({
    id: IdSchema,
    providerRef: z.string().min(1),
    slices: z
      .array(
        z
          .object({
            segments: z.array(SegmentSchema).min(1),
            durationMinutes: z.number().int().positive(),
          })
          .strict(),
      )
      .min(1),
    validatingCarrier: AirlineSchema,
    baggage: BaggageAllowanceSchema,
    refundable: z.boolean(),
    seatsLeft: z.number().int().min(0).optional(),
    fares: z.array(FareBreakdownSchema).min(1),
    totalPrice: TakaSchema,
    rules: z.array(FareRuleSchema).default([]),
    expiresAt: IsoDateTimeSchema,
    sample: SampleFlagSchema,
  })
  .strict();

export const CancellationPolicySchema = z
  .object({
    freeUntil: IsoDateTimeSchema.optional(),
    text: z.string().min(1),
  })
  .strict();

export const RatePlanSchema = z
  .object({
    id: IdSchema,
    name: z.string().min(1),
    board: z.enum(["room-only", "breakfast", "half-board", "full-board", "all-inclusive"]),
    refundable: z.boolean(),
    cancellation: CancellationPolicySchema,
    pricePerNight: TakaSchema,
    total: TakaSchema,
  })
  .strict();

export const HotelOfferSchema = z
  .object({
    id: IdSchema,
    name: z.string().min(1),
    stars: z.number().int().min(1).max(5),
    area: z.string().min(1),
    city: z.string().min(1),
    guestRating: z.number().min(0).max(10).optional(),
    amenities: z.array(z.string().min(1)),
    images: z.array(ImageSchema).min(1),
    location: z.object({ lat: z.number(), lng: z.number() }).strict(),
    rooms: z
      .array(
        z
          .object({
            id: IdSchema,
            name: z.string().min(1),
            ratePlans: z.array(RatePlanSchema).min(1),
          })
          .strict(),
      )
      .min(1),
    fromPrice: TakaSchema,
    sample: SampleFlagSchema,
  })
  .strict();

export const TicketSchema = z
  .object({
    number: z.string().min(1),
    passengerName: z.string().min(1),
    issuedAt: IsoDateTimeSchema,
  })
  .strict();

export const BookingSchema = z
  .object({
    id: IdSchema,
    reference: z.string().min(1),
    module: z.enum(["flights", "hotels", "packages"]),
    pnr: z.string().max(12).optional(),
    status: z.enum(["held", "confirmed", "ticketed", "cancelled", "refunded"]),
    amount: TakaSchema,
    paymentStatus: z.enum(["unpaid", "partial", "paid", "refunded"]),
    tickets: z.array(TicketSchema).default([]),
    createdAt: IsoDateTimeSchema,
    leadReference: z.string().optional(),
    sample: SampleFlagSchema,
  })
  .strict();

export type Iata = z.infer<typeof IataSchema>;
export type Airport = z.infer<typeof AirportSchema>;
export type Airline = z.infer<typeof AirlineSchema>;
export type CabinClass = z.infer<typeof CabinClassSchema>;
export type GroupFare = z.infer<typeof GroupFareSchema>;
export type PackageCategory = z.infer<typeof PackageCategorySchema>;
export type PackageTag = z.infer<typeof PackageTagSchema>;
export type ItineraryDay = z.infer<typeof ItineraryDaySchema>;
export type RoomSharing = z.infer<typeof RoomSharingSchema>;
export type PackagePrice = z.infer<typeof PackagePriceSchema>;
export type PackageDeparture = z.infer<typeof PackageDepartureSchema>;
export type PackageHotel = z.infer<typeof PackageHotelSchema>;
export type TourPackage = z.infer<typeof TourPackageSchema>;
export type HotelPlace = z.infer<typeof HotelPlaceSchema>;
export type HotelAmenity = z.infer<typeof HotelAmenitySchema>;
export type HotelRoomType = z.infer<typeof HotelRoomTypeSchema>;
export type Hotel = z.infer<typeof HotelSchema>;
export type BaggageAllowance = z.infer<typeof BaggageAllowanceSchema>;
export type Segment = z.infer<typeof SegmentSchema>;
export type FareBreakdown = z.infer<typeof FareBreakdownSchema>;
export type FareRule = z.infer<typeof FareRuleSchema>;
export type FlightOffer = z.infer<typeof FlightOfferSchema>;
export type FlightRoute = z.infer<typeof FlightRouteSchema>;
export type CancellationPolicy = z.infer<typeof CancellationPolicySchema>;
export type RatePlan = z.infer<typeof RatePlanSchema>;
export type HotelOffer = z.infer<typeof HotelOfferSchema>;
export type Ticket = z.infer<typeof TicketSchema>;
export type Booking = z.infer<typeof BookingSchema>;
