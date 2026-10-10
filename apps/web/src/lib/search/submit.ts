import {
  FlightSearchSchema,
  HotelSearchSchema,
  type Airport,
  type SearchLogInput,
  type VisaTypeKey,
  VisaTypeKeySchema,
} from "@waafa/shared";
import { flightSearchHref } from "./flightParams";
import { distributeGuests, hotelSearchHref } from "./hotelParams";
import { formatShortDate, formatShortMonth } from "./isoDate";
import type { RecentSearch, SearchModule } from "./recentSearches";
import {
  validateFlight,
  validateHotel,
  validateVisa,
  type FieldErrors,
  type FlightDraft,
  type HotelDraft,
  type SearchState,
  type TourDraft,
  type VisaDraft,
} from "./searchState";
import { tourSearchHref } from "./tourParams";
import { visaSearchHref } from "./visaParams";

/*
 * Submitting the search card: validate the active tab, build the destination URL (FR-SRCH-09), the
 * search-log payload (FR-SRCH-10) and the recent-search chip. Pure, so every rule is unit-tested.
 */

export const VISA_TYPE_KEYS = VisaTypeKeySchema.options;

export type SearchSubmission = {
  module: SearchModule;
  href: string;
  /** Short, language-neutral summary: "DAC → DXB · 22 Oct". Used for the log and the recent chip. */
  summary: string;
  params: SearchLogInput["params"];
  airports?: Airport[];
};

export type SubmitResult =
  { ok: false; errors: FieldErrors } | { ok: true; submission: SearchSubmission };

export type SubmitLabels = {
  /** "Tourist", "Business"… for the visa summary. */
  visaTypes: Record<VisaTypeKey, string>;
  /** "Any month" for a tour search without a month. */
  anyMonth: string;
};

const fail = (errors: FieldErrors): SubmitResult => ({ ok: false, errors });

function dateRange(start: string, end: string | null): string {
  return end ? `${formatShortDate(start)} – ${formatShortDate(end)}` : formatShortDate(start);
}

export function submitFlight(flight: FlightDraft, today: string): SubmitResult {
  const errors = validateFlight(flight, today);
  if (Object.keys(errors).length > 0) return fail(errors);

  const multi = flight.trip === "multi-city";
  const legs = multi
    ? flight.legs.map((leg) => ({
        from: leg.from?.iata ?? "",
        to: leg.to?.iata ?? "",
        date: leg.date ?? "",
      }))
    : [{ from: flight.from?.iata ?? "", to: flight.to?.iata ?? "", date: flight.depart ?? "" }];
  const parsed = FlightSearchSchema.safeParse({
    tripType: flight.trip,
    legs,
    ...(flight.trip === "round-trip" && flight.return ? { returnDate: flight.return } : {}),
    travellers: {
      adults: flight.adults,
      childAges: flight.childAges.map((age) => age ?? 0),
      infants: flight.infants,
    },
    cabin: flight.cabin,
    ...(flight.airline ? { preferredAirline: flight.airline } : {}),
    directOnly: flight.direct,
    flexibleDates: flight.flex,
    fareType: flight.fare,
  });
  if (!parsed.success) return fail({ travellers: "tooManyTravellers" });

  const search = parsed.data;
  const route = multi
    ? [legs[0]?.from, ...legs.map((leg) => leg.to)].join(" → ")
    : `${legs[0]?.from} ${flight.trip === "round-trip" ? "⇄" : "→"} ${legs[0]?.to}`;
  const first = legs[0]?.date ?? "";
  const when = multi
    ? formatShortDate(first)
    : dateRange(first, flight.trip === "round-trip" ? flight.return : null);
  const airports = (
    multi ? flight.legs.flatMap((leg) => [leg.from, leg.to]) : [flight.from, flight.to]
  ).filter((airport): airport is Airport => airport !== null);
  const travellers = flight.adults + flight.childAges.length + flight.infants;

  return {
    ok: true,
    submission: {
      module: "flights",
      href: flightSearchHref(search),
      summary: `${route} · ${when}`,
      params: {
        trip: search.tripType,
        route: legs.map((leg) => `${leg.from}-${leg.to}-${leg.date}`).join(","),
        ...(search.returnDate ? { return: search.returnDate } : {}),
        travellers,
        cabin: search.cabin,
        direct: search.directOnly,
        flex: search.flexibleDates,
        fare: search.fareType,
        ...(search.preferredAirline ? { airline: search.preferredAirline } : {}),
      },
      airports,
    },
  };
}

export function submitHotel(hotel: HotelDraft, today: string): SubmitResult {
  const errors = validateHotel(hotel, today);
  if (Object.keys(errors).length > 0 || !hotel.place) return fail(errors);

  const childAges = hotel.childAges.map((age) => age ?? 0);
  const parsed = HotelSearchSchema.safeParse({
    placeId: hotel.place.id,
    placeLabel: hotel.place.name,
    checkIn: hotel.checkin,
    checkOut: hotel.checkout,
    rooms: distributeGuests(hotel.rooms, hotel.adults, childAges),
    nationality: hotel.nationality,
  });
  if (!parsed.success) return fail({ rooms: "tooManyTravellers" });

  return {
    ok: true,
    submission: {
      module: "hotels",
      href: hotelSearchHref(parsed.data),
      summary: `${hotel.place.name} · ${dateRange(parsed.data.checkIn, parsed.data.checkOut)}`,
      params: {
        place: hotel.place.id,
        checkin: parsed.data.checkIn,
        checkout: parsed.data.checkOut,
        rooms: hotel.rooms,
        guests: hotel.adults + childAges.length,
        nationality: hotel.nationality,
      },
    },
  };
}

export function submitTour(tour: TourDraft, labels: SubmitLabels): SubmitResult {
  const search = tour.search.trim().slice(0, 80);
  const href = tourSearchHref({
    destination: tour.destination?.slug ?? null,
    search: search || null,
    month: tour.month,
    adults: tour.adults,
    children: tour.children,
  });
  const where = tour.destination?.name ?? (search || null);
  const when = tour.month ? formatShortMonth(tour.month) : labels.anyMonth;
  return {
    ok: true,
    submission: {
      module: "packages",
      href,
      summary: where ? `${where} · ${when}` : when,
      params: {
        ...(tour.destination ? { destination: tour.destination.slug } : {}),
        ...(search && !tour.destination ? { search } : {}),
        ...(tour.month ? { month: tour.month } : {}),
        travellers: tour.adults + tour.children,
      },
    },
  };
}

export function submitVisa(visa: VisaDraft, labels: SubmitLabels): SubmitResult {
  const errors = validateVisa(visa);
  if (Object.keys(errors).length > 0 || !visa.country) return fail(errors);
  return {
    ok: true,
    submission: {
      module: "visa",
      href: visaSearchHref(visa.country.slug, visa.type, visa.applicants),
      summary: `${visa.country.name} · ${labels.visaTypes[visa.type]}`,
      params: { country: visa.country.slug, type: visa.type, applicants: visa.applicants },
    },
  };
}

export function submitSearch(
  state: SearchState,
  today: string,
  labels: SubmitLabels,
): SubmitResult {
  switch (state.tab) {
    case "flight":
      return submitFlight(state.flight, today);
    case "hotel":
      return submitHotel(state.hotel, today);
    case "tour":
      return submitTour(state.tour, labels);
    case "visa":
      return submitVisa(state.visa, labels);
  }
}

export function toRecentSearch(submission: SearchSubmission, at: number): RecentSearch {
  return {
    module: submission.module,
    label: submission.summary.slice(0, 120),
    href: submission.href,
    at,
    ...(submission.airports?.length ? { airports: submission.airports.slice(0, 10) } : {}),
  };
}

export function toSearchLog(
  submission: SearchSubmission,
  device: SearchLogInput["device"],
  source: string,
): SearchLogInput {
  return {
    module: submission.module,
    summary: submission.summary.slice(0, 160),
    params: submission.params,
    device,
    source: source.slice(0, 120) || "/",
  };
}

/** Phone below 768 px, tablet below 1024 px, desktop above (matches the layout breakpoints). */
export function deviceForWidth(width: number): SearchLogInput["device"] {
  if (width < 768) return "phone";
  if (width < 1024) return "tablet";
  return "desktop";
}
