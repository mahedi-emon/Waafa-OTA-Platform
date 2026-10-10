import { LeadCreateInputSchema } from "@waafa/shared";
import { describe, expect, it } from "vitest";
import {
  ANY_DATE,
  buildPackageLead,
  estimatePackageTotal,
  packageQuerySchema,
} from "./packageLeadForm";
import { buildPlanTripLead, planTripDefaults, planTripSchema } from "./planTripLeadForm";

const contact = {
  name: "Sample Nadia Islam",
  phoneCountry: "BD",
  phone: "01912-345678",
  email: "",
};

describe("package query", () => {
  it("needs consent and keeps infants within adults", () => {
    const result = packageQuerySchema.safeParse({
      departure: "",
      adults: 1,
      children: 0,
      infants: 2,
      roomSharing: "twin",
      preferredContact: "call",
      notes: "",
      consent: false,
    });
    expect((result.error?.issues ?? []).map((i) => i.message)).toEqual(
      expect.arrayContaining(["departureRequired", "infantsOverAdults", "consentRequired"]),
    );
  });

  it("builds a PKG lead with any date", () => {
    const query = packageQuerySchema.parse({
      departure: ANY_DATE,
      adults: 2,
      children: 1,
      infants: 0,
      roomSharing: "triple",
      preferredContact: "whatsapp",
      notes: "",
      consent: true,
    });
    const lead = LeadCreateInputSchema.parse(
      buildPackageLead({
        contact,
        query,
        pkg: { id: "pkg-1", title: "Maldives" },
        page: "/tour-packages/maldives",
      }),
    );
    expect(lead.payload).toMatchObject({
      module: "packages",
      departure: "any",
      roomSharing: "triple",
    });
  });
});

describe("plan my trip", () => {
  it("asks for a place or Not sure, and a month or exact dates", () => {
    const result = planTripSchema.safeParse({ ...planTripDefaults(), consent: true });
    expect((result.error?.issues ?? []).map((i) => i.message)).toEqual(
      expect.arrayContaining(["placesRequired", "monthRequired"]),
    );
  });

  it("builds a CTR lead from exact dates, counting nights", () => {
    const plan = planTripSchema.parse({
      ...planTripDefaults("Nepal"),
      dateMode: "exact",
      startDate: "2026-12-10",
      endDate: "2026-12-15",
      consent: true,
    });
    const lead = LeadCreateInputSchema.parse(
      buildPlanTripLead({ contact, plan, notSureLabel: "Not sure yet", page: "/plan-my-trip" }),
    );
    expect(lead.payload).toMatchObject({
      module: "plan-trip",
      destinations: ["Nepal"],
      startDate: "2026-12-10",
      nights: 5,
    });
  });

  it("sends Not sure yet when no place is chosen", () => {
    const plan = planTripSchema.parse({
      ...planTripDefaults(),
      notSure: true,
      month: "2027-01",
      consent: true,
    });
    const lead = LeadCreateInputSchema.parse(
      buildPlanTripLead({ contact, plan, notSureLabel: "Not sure yet", page: "/plan-my-trip" }),
    );
    expect(lead.payload).toMatchObject({ destinations: ["Not sure yet"], month: "2027-01" });
  });
});

describe("package estimate", () => {
  const prices = [
    { sharing: "twin", label: "Twin sharing", detail: "Two adults in one room", price: 145000 },
    { sharing: "single", label: "Single room", detail: "One adult alone", price: 172000 },
    { sharing: "child-with-bed", label: "Child with bed", detail: "Ages 2 to 11", price: 128000 },
    { sharing: "infant", label: "Infant", detail: "Under 2", price: 28000 },
  ] as const;

  it("adds adults at the room price, children and infants at theirs", () => {
    expect(
      estimatePackageTotal([...prices], {
        adults: 2,
        children: 1,
        infants: 1,
        roomSharing: "twin",
      }),
    ).toBe(2 * 145000 + 128000 + 28000);
    expect(
      estimatePackageTotal([...prices], {
        adults: 1,
        children: 0,
        infants: 0,
        roomSharing: "single",
      }),
    ).toBe(172000);
  });

  it("falls back to the first price when a sharing has no row", () => {
    expect(
      estimatePackageTotal([prices[0]], {
        adults: 3,
        children: 1,
        infants: 1,
        roomSharing: "triple",
      }),
    ).toBe(4 * 145000);
  });
});
