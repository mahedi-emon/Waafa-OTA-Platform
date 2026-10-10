import type { Airport } from "@waafa/shared";
import { describe, expect, it } from "vitest";
import { flightDraftFromSearch } from "./flightDraft";

const airports = new Map<string, Airport>([
  [
    "DAC",
    {
      iata: "DAC",
      city: "Dhaka",
      name: "Hazrat Shahjalal",
      country: "Bangladesh",
      countryCode: "BD",
    },
  ],
  [
    "DXB",
    { iata: "DXB", city: "Dubai", name: "Dubai International", country: "UAE", countryCode: "AE" },
  ],
]);

describe("flightDraftFromSearch", () => {
  it("fills a round trip with airports, dates, travellers and options", () => {
    const draft = flightDraftFromSearch(
      {
        tripType: "round-trip",
        legs: [{ from: "DAC", to: "DXB", date: "2026-10-22" }],
        returnDate: "2026-10-29",
        travellers: { adults: 2, childAges: [5], infants: 1 },
        cabin: "business",
        preferredAirline: "EK",
        directOnly: true,
        flexibleDates: false,
        fareType: "regular",
      },
      airports,
    );
    expect(draft).toMatchObject({
      trip: "round-trip",
      depart: "2026-10-22",
      return: "2026-10-29",
      adults: 2,
      childAges: [5],
      infants: 1,
      cabin: "business",
      airline: "EK",
      direct: true,
    });
    expect([draft.from?.city, draft.to?.city]).toEqual(["Dhaka", "Dubai"]);
  });

  it("keeps unknown airports empty and maps multi-city legs", () => {
    const draft = flightDraftFromSearch(
      {
        tripType: "multi-city",
        legs: [
          { from: "DAC", to: "XYZ", date: "2026-10-22" },
          { from: "XYZ", to: "DXB", date: "2026-10-25" },
        ],
        travellers: { adults: 1, childAges: [], infants: 0 },
        cabin: "economy",
        directOnly: false,
        flexibleDates: false,
        fareType: "regular",
      },
      airports,
    );
    expect(draft.legs.map((leg) => [leg.from?.iata ?? null, leg.to?.iata ?? null])).toEqual([
      ["DAC", null],
      [null, "DXB"],
    ]);
  });
});
