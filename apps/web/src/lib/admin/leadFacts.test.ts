import { describe, expect, it } from "vitest";
import { leadFacts, type LeadWords } from "./leadFacts";

const words: LeadWords = {
  label: (key) => `[${key}]`,
  value: (group, value) => (group === "tripType" && value === "round-trip" ? "Return" : undefined),
  travellers: (adults, children, infants) => `${adults}a ${children}c ${infants}i`,
  flight: (n) => `Flight ${n}`,
  airport: (iata) => ({ DAC: "Dhaka (DAC)", DXB: "Dubai (DXB)" })[iata] ?? iata,
  anyDate: "Any date",
  files: (count) => `${count} files`,
  yes: "Yes",
  no: "No",
};

const byLabel = (facts: Array<{ label: string; value: string }>) =>
  Object.fromEntries(facts.map((fact) => [fact.label, fact.value]));

describe("leadFacts", () => {
  it("reads a flight request as route, dates, travellers and cabin", () => {
    const facts = leadFacts(
      {
        module: "flights",
        search: {
          tripType: "round-trip",
          legs: [{ from: "DAC", to: "DXB", date: "2026-11-14" }],
          returnDate: "2026-11-21",
          travellers: { adults: 2, childAges: [7], infants: 0 },
          cabin: "premium-economy",
          directOnly: true,
          flexibleDates: false,
        },
        preferences: { stops: "any", times: [], airlines: [], bag: "30", refundableOnly: false },
        notes: "Window seats please",
      },
      words,
    );
    expect(byLabel(facts)).toEqual({
      "[trip]": "Return",
      "Flight 1": "Dhaka (DAC) → Dubai (DXB), 14 Nov 2026",
      "[returnDate]": "21 Nov 2026",
      "[travellers]": "2a 1c 0i",
      "[cabin]": "Premium economy",
      "[directOnly]": "Yes",
      "[bag]": "30",
      "[notes]": "Window seats please",
    });
  });

  it("says Any date for open package departures and lists visa documents by name", () => {
    expect(
      byLabel(
        leadFacts(
          {
            module: "packages",
            packageId: "pkg-1",
            packageTitle: "Bali 5 days",
            departure: "any",
            travellers: { adults: 2, children: 0, infants: 1 },
            roomSharing: "twin",
          },
          words,
        ),
      ),
    ).toEqual({
      "[package]": "Bali 5 days",
      "[departure]": "Any date",
      "[travellers]": "2a 0c 1i",
      "[roomSharing]": "Twin",
    });
    const visa = leadFacts(
      {
        module: "visa",
        countrySlug: "thailand",
        countryName: "Thailand",
        visaType: "tourist",
        applicants: 2,
        travelDate: "2026-12-01",
        documents: [{ fileName: "passport.pdf" }, { fileName: "photo.jpg" }],
      },
      words,
    );
    expect(byLabel(visa)["[documents]"]).toBe("2 files: passport.pdf, photo.jpg");
    expect(visa.find((fact) => fact.label === "[documents]")?.wide).toBe(true);
  });

  it("still shows fields it doesn't know, labelled in plain words", () => {
    const facts = leadFacts(
      { module: "contact", topic: "visa", message: "Hello there", extraField: "x" },
      words,
    );
    expect(byLabel(facts)).toEqual({
      "[topic]": "Visa",
      "[message]": "Hello there",
      "Extra field": "x",
    });
  });
});
