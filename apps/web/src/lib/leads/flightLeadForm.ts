import {
  CabinClassSchema,
  FlightSearchSchema,
  PreferredContactSchema,
  type FlightPreferences,
  type FlightSearch,
  type LeadCreateInput,
} from "@waafa/shared";
import { z } from "zod";
import { contactToLead, type ContactStepValues } from "./contactForm";

/*
 * The two-step flight request (FR-FLT-02 to FR-FLT-05): step 1 asks how to reach the visitor, step 2 confirms the
 * trip prefilled from the URL. Messages are next-intl keys under "Flights.errors"; the server validates again with
 * the shared LeadCreateInputSchema.
 */

export type { ContactStepValues };

export type ErrorKey =
  | "nameRequired"
  | "phoneInvalid"
  | "emailRequired"
  | "emailInvalid"
  | "fromRequired"
  | "toRequired"
  | "sameAirport"
  | "departRequired"
  | "returnBeforeDepart"
  | "consentRequired";

const IATA = /^[A-Z]{3}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const tripStepSchema = z
  .object({
    from: z.string(),
    to: z.string(),
    depart: z.string(),
    return: z.string(),
    cabin: CabinClassSchema,
    airline: z.string(),
    flex: z.boolean(),
    preferredContact: PreferredContactSchema,
    bestTime: z.string().max(40),
    notes: z.string().max(1000),
    consent: z.boolean(),
  })
  // All rules run together (inner-field failures would skip a refinement), so every message shows at once.
  .superRefine((values, ctx) => {
    const issue = (path: string, message: ErrorKey) =>
      ctx.addIssue({ code: "custom", message, path: [path] });
    if (!IATA.test(values.from)) issue("from", "fromRequired");
    if (!IATA.test(values.to)) issue("to", "toRequired");
    if (!ISO_DATE.test(values.depart)) issue("depart", "departRequired");
    if (values.return && !ISO_DATE.test(values.return)) issue("return", "returnBeforeDepart");
    if (!values.consent) issue("consent", "consentRequired");
    if (values.from && values.from === values.to) {
      ctx.addIssue({ code: "custom", message: "sameAirport", path: ["to"] });
    }
    if (values.return && values.depart && values.return < values.depart) {
      ctx.addIssue({ code: "custom", message: "returnBeforeDepart", path: ["return"] });
    }
  });

export type TripStepInput = z.input<typeof tripStepSchema>;
export type TripStepValues = z.output<typeof tripStepSchema>;

/** Step 2 defaults from the URL search (one-way or round trip; multi-city starts from its first leg). */
export function tripDefaults(search: FlightSearch | null, fareDate?: string): TripStepInput {
  const first = search?.legs[0];
  return {
    from: first?.from ?? "",
    to: first?.to ?? "",
    depart: fareDate ?? first?.date ?? "",
    return: search?.tripType === "round-trip" ? (search.returnDate ?? "") : "",
    cabin: search?.cabin ?? "economy",
    airline: search?.preferredAirline ?? "",
    flex: search?.flexibleDates ?? false,
    preferredContact: "call",
    bestTime: "",
    notes: "",
    consent: false,
  };
}

/** The request as the shared lead contract expects it (the server parses it again). */
export function buildFlightLead(args: {
  contact: ContactStepValues;
  trip: TripStepValues;
  search: FlightSearch | null;
  preferences: FlightPreferences;
  groupFareId?: string;
  page: string;
}): LeadCreateInput {
  const { contact, trip, search, preferences } = args;
  const multi = search?.tripType === "multi-city";
  const legs = multi
    ? [{ from: trip.from, to: trip.to, date: trip.depart }, ...(search?.legs.slice(1) ?? [])]
    : [{ from: trip.from, to: trip.to, date: trip.depart }];
  const flightSearch = FlightSearchSchema.parse({
    tripType: multi ? "multi-city" : trip.return ? "round-trip" : "one-way",
    legs,
    ...(trip.return && !multi ? { returnDate: trip.return } : {}),
    travellers: search?.travellers ?? { adults: 1, childAges: [], infants: 0 },
    cabin: trip.cabin,
    ...(trip.airline ? { preferredAirline: trip.airline } : {}),
    directOnly: preferences.stops === "direct" || (search?.directOnly ?? false),
    flexibleDates: trip.flex,
    fareType: search?.fareType ?? "regular",
  });

  return {
    contact: contactToLead(contact, trip.preferredContact, trip.bestTime),
    payload: {
      module: "flights",
      search: flightSearch,
      ...(args.groupFareId ? { groupFareId: args.groupFareId } : {}),
      preferences,
      ...(trip.notes.trim() ? { notes: trip.notes.trim() } : {}),
    },
    consent: true,
    source: { channel: "web", page: args.page },
  };
}
