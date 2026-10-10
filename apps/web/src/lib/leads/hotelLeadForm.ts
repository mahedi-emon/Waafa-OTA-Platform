import {
  HotelBudgetBandSchema,
  HotelMealsSchema,
  HotelSearchSchema,
  MAX_HOTEL_NIGHTS,
  MAX_HOTEL_ROOMS,
  PreferredContactSchema,
  daysBetween,
  type HotelSearch,
  type LeadCreateInput,
} from "@waafa/shared";
import { z } from "zod";
import { contactToLead, type ContactStepValues } from "./contactForm";
import { distributeGuests } from "../search/hotelParams";

/*
 * Hotel request step 2 (Hotels-2, FR-HTL): the stay prefilled from the URL (place, nationality, dates), budget band,
 * meals, notes and consent. Messages are next-intl keys under "Hotels.errors" (consent under "Leads.errors").
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Per room, as the hotel search allows (HotelRoomSchema). */
export const ADULTS_PER_ROOM = 6;
export const CHILDREN_PER_ROOM = 4;

export const stayStepSchema = z
  .object({
    place: z.string().trim().max(80),
    nationality: z.string().regex(/^[A-Z]{2}$/),
    checkin: z.string(),
    checkout: z.string(),
    budgetBand: HotelBudgetBandSchema,
    meals: HotelMealsSchema,
    stars: z.enum(["any", "3", "4", "5"]),
    /** Rooms and guests, asked here so a visitor who arrives without a search is not sent as two adults. */
    guests: z.object({
      rooms: z.number().int().min(1).max(MAX_HOTEL_ROOMS),
      adults: z
        .number()
        .int()
        .min(1)
        .max(MAX_HOTEL_ROOMS * ADULTS_PER_ROOM),
      childAges: z.array(z.number().int().min(0).max(17)).max(MAX_HOTEL_ROOMS * CHILDREN_PER_ROOM),
    }),
    preferredContact: PreferredContactSchema,
    bestTime: z.enum(["any", "morning", "midday", "afternoon"]),
    notes: z.string().max(1000),
    consent: z.boolean(),
  })
  // Every rule runs together so all messages show at once.
  .superRefine((values, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", message, path: [path] });
    if (values.place.length < 2) issue("place", "placeRequired");
    if (!ISO_DATE.test(values.checkin)) issue("checkin", "checkinRequired");
    if (!ISO_DATE.test(values.checkout)) issue("checkout", "checkoutRequired");
    else if (ISO_DATE.test(values.checkin)) {
      const nights = daysBetween(values.checkin, values.checkout);
      if (nights < 1) issue("checkout", "checkoutAfterCheckin");
      else if (nights > MAX_HOTEL_NIGHTS) issue("checkout", "stayTooLong");
    }
    if (!values.consent) issue("consent", "consentRequired");
    const { rooms, adults, childAges } = values.guests;
    if (adults < rooms) issue("guests", "adultPerRoom");
    else if (adults > rooms * ADULTS_PER_ROOM || childAges.length > rooms * CHILDREN_PER_ROOM) {
      issue("guests", "tooManyGuests");
    }
  });

export type StayStepInput = z.input<typeof stayStepSchema>;
export type StayStepValues = z.output<typeof stayStepSchema>;

export function stayDefaults(search: HotelSearch | null): StayStepInput {
  return {
    place: search?.placeLabel ?? "",
    nationality: search?.nationality ?? "BD",
    checkin: search?.checkIn ?? "",
    checkout: search?.checkOut ?? "",
    budgetBand: "any",
    meals: "any",
    stars: "any",
    guests: {
      rooms: search?.rooms.length ?? 1,
      adults: search ? search.rooms.reduce((sum, room) => sum + room.adults, 0) : 2,
      childAges: search ? search.rooms.flatMap((room) => room.childAges) : [],
    },
    preferredContact: "call",
    bestTime: "any",
    notes: "",
    consent: false,
  };
}

export function buildHotelLead(args: {
  contact: ContactStepValues;
  stay: StayStepValues;
  search: HotelSearch | null;
  preferences: { seaView: boolean; freeCancellation: boolean };
  page: string;
}): LeadCreateInput {
  const { contact, stay, search, preferences } = args;
  const samePlace = search && search.placeLabel === stay.place;
  const hotelSearch = HotelSearchSchema.parse({
    placeId: samePlace ? search.placeId : "typed",
    placeLabel: stay.place,
    checkIn: stay.checkin,
    checkOut: stay.checkout,
    rooms: distributeGuests(stay.guests.rooms, stay.guests.adults, stay.guests.childAges),
    nationality: stay.nationality,
  });
  return {
    contact: contactToLead(
      contact,
      stay.preferredContact,
      stay.bestTime === "any" ? "" : stay.bestTime,
    ),
    payload: {
      module: "hotels",
      search: hotelSearch,
      starPreference: stay.stars,
      budgetBand: stay.budgetBand,
      meals: stay.meals,
      seaView: preferences.seaView,
      freeCancellation: preferences.freeCancellation,
      ...(stay.notes.trim() ? { notes: stay.notes.trim() } : {}),
    },
    consent: true,
    source: { channel: "web", page: args.page },
  };
}
