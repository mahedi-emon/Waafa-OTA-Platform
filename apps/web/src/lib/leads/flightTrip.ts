import type { FlightSearch } from "@waafa/shared";
import type { TripStepInput } from "./flightLeadForm";

/*
 * The flight request's step 2 defaults, kept apart from the zod schema in flightLeadForm.ts so the page can fill the
 * form without loading validation first (issue 170).
 */

/** Step 2 defaults from the URL search (one-way or round trip; multi-city starts from its first leg). */
export function tripDefaults(
  search: FlightSearch | null,
  fareDate?: string,
  prefill?: { from?: string; to?: string; depart?: string },
): TripStepInput {
  const first = search?.legs[0];
  return {
    from: first?.from ?? prefill?.from ?? "",
    to: first?.to ?? prefill?.to ?? "",
    depart: fareDate ?? first?.date ?? prefill?.depart ?? "",
    return: search?.tripType === "round-trip" ? (search.returnDate ?? "") : "",
    cabin: search?.cabin ?? "economy",
    travellers: {
      adults: search?.travellers.adults ?? 1,
      childAges: [...(search?.travellers.childAges ?? [])],
      infants: search?.travellers.infants ?? 0,
    },
    airline: search?.preferredAirline ?? "",
    flex: search?.flexibleDates ?? false,
    preferredContact: "call",
    bestTime: "",
    notes: "",
    consent: false,
  };
}
