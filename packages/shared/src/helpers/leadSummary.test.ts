import { describe, expect, it } from "vitest";
import { leadDigest } from "./leadSummary";

describe("leadDigest", () => {
  it("summarises a round trip with the travellers and the first date", () => {
    expect(
      leadDigest({
        module: "flights",
        search: {
          tripType: "round-trip",
          legs: [{ from: "DAC", to: "DXB", date: "2026-11-14" }],
          returnDate: "2026-11-21",
          travellers: { adults: 2, childAges: [7], infants: 0 },
          cabin: "economy",
          directOnly: false,
          flexibleDates: false,
          fareType: "regular",
        },
      }),
    ).toEqual({
      summary: "DAC ⇄ DXB · 14 Nov · 3 travellers",
      travelDate: "2026-11-14",
      travellers: 3,
    });
  });

  it("summarises hotels, visas and a long contact message", () => {
    expect(
      leadDigest({
        module: "hotels",
        search: {
          placeId: "x",
          placeLabel: "Cox’s Bazar",
          checkIn: "2026-11-14",
          checkOut: "2026-11-16",
          rooms: [{ adults: 2, childAges: [] }],
          nationality: "BD",
        },
        starPreference: "any",
        budgetBand: "any",
        meals: "any",
        seaView: false,
        freeCancellation: false,
      }).summary,
    ).toBe("Cox’s Bazar · 14 Nov to 16 Nov · 1 room, 2 guests");
    expect(
      leadDigest({
        module: "visa",
        countrySlug: "thailand",
        countryName: "Thailand",
        visaType: "tourist",
        applicants: 1,
        travelDate: "2026-12-01",
        documents: [],
      }).summary,
    ).toBe("Thailand tourist visa · 1 applicant · travel 1 Dec");
    const long = leadDigest({ module: "contact", topic: "other", message: "word ".repeat(80) });
    expect(long.summary.length).toBeLessThanOrEqual(140);
    expect(long.summary.endsWith("…")).toBe(true);
  });
});
