import {
  HotelBudgetBandSchema,
  HotelMealsSchema,
  HotelSearchSchema,
  MAX_HOTEL_NIGHTS,
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

export const stayStepSchema = z
  .object({
    place: z.string().trim().max(80),
    nationality: z.string().regex(/^[A-Z]{2}$/),
    checkin: z.string(),
    checkout: z.string(),
    budgetBand: HotelBudgetBandSchema,
    meals: HotelMealsSchema,
    preferredContact: PreferredContactSchema,
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
    preferredContact: "call",
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
    rooms: search?.rooms ?? distributeGuests(1, 2, []),
    nationality: stay.nationality,
  });
  return {
    contact: contactToLead(contact, stay.preferredContact, ""),
    payload: {
      module: "hotels",
      search: hotelSearch,
      starPreference: "any",
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
