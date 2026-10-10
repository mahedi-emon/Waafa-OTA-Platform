import {
  AirportSchema,
  CabinClassSchema,
  HotelPlaceSchema,
  VisaTypeKeySchema,
} from "@waafa/shared";
import { z } from "zod";
import type { SearchDraft, SearchState } from "./searchState";

/*
 * The submitted search card, kept for this tab only (sessionStorage), so Back restores exactly what the visitor
 * typed even when the results page was a full page load. Validated on read: a stale or edited value is ignored.
 */

/** One snapshot per card placement ("home", "flights"…), so a results-page card never restores the home search. */
export function draftSnapshotKey(source: string): string {
  return `waafa:search-draft:v1:${source}`;
}

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Ages = z.array(z.number().int().min(0).max(11).nullable()).max(9);

const DraftSchema = z.object({
  tab: z.enum(["flight", "hotel", "tour", "visa"]),
  flight: z.object({
    trip: z.enum(["one-way", "round-trip", "multi-city"]),
    from: AirportSchema.nullable(),
    to: AirportSchema.nullable(),
    depart: IsoDate.nullable(),
    return: IsoDate.nullable(),
    legs: z
      .array(
        z.object({
          from: AirportSchema.nullable(),
          to: AirportSchema.nullable(),
          date: IsoDate.nullable(),
        }),
      )
      .max(5),
    adults: z.number().int().min(1).max(9),
    childAges: Ages,
    infants: z.number().int().min(0).max(9),
    cabin: CabinClassSchema,
    direct: z.boolean(),
    flex: z.boolean(),
    fare: z.enum(["regular", "student"]),
    airline: z
      .string()
      .regex(/^[A-Z0-9]{2}$/)
      .nullable(),
  }),
  hotel: z.object({
    place: HotelPlaceSchema.nullable(),
    checkin: IsoDate.nullable(),
    checkout: IsoDate.nullable(),
    rooms: z.number().int().min(1).max(5),
    adults: z.number().int().min(1).max(30),
    childAges: z.array(z.number().int().min(0).max(11).nullable()).max(8),
    nationality: z.string().regex(/^[A-Z]{2}$/),
  }),
  tour: z.object({
    destination: z
      .object({
        slug: z.string(),
        name: z.string(),
        subtitle: z.string(),
        domestic: z.boolean(),
        countryCode: z.string().nullable(),
      })
      .nullable(),
    search: z.string().max(80),
    month: z
      .string()
      .regex(/^\d{4}-\d{2}$/)
      .nullable(),
    adults: z.number().int().min(1).max(30),
    children: z.number().int().min(0).max(10),
  }),
  visa: z.object({
    country: z
      .object({
        slug: z.string(),
        name: z.string(),
        flagCode: z.string(),
        region: z.string(),
        popular: z.boolean(),
        types: z.array(VisaTypeKeySchema),
      })
      .nullable(),
    type: VisaTypeKeySchema,
    applicants: z.number().int().min(1).max(10),
  }),
});

export function serializeDraft(state: SearchState): string {
  const draft: SearchDraft = {
    tab: state.tab,
    flight: state.flight,
    hotel: state.hotel,
    tour: state.tour,
    visa: state.visa,
  };
  return JSON.stringify(draft);
}

export function parseDraft(raw: string | null | undefined): SearchDraft | null {
  if (!raw) return null;
  try {
    const parsed = DraftSchema.safeParse(JSON.parse(raw));
    return parsed.success ? (parsed.data as SearchDraft) : null;
  } catch {
    return null;
  }
}
