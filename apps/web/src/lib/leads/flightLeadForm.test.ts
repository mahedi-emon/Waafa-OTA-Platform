import { LeadCreateInputSchema, type FlightSearch } from "@waafa/shared";
import { describe, expect, it } from "vitest";
import { contactStepSchema } from "./contactForm";
import { buildFlightLead, tripDefaults, tripStepSchema } from "./flightLeadForm";

const search: FlightSearch = {
  tripType: "round-trip",
  legs: [{ from: "DAC", to: "DXB", date: "2026-10-22" }],
  returnDate: "2026-10-29",
  travellers: { adults: 2, childAges: [7], infants: 0 },
  cabin: "economy",
  directOnly: false,
  flexibleDates: false,
  fareType: "regular",
};
const preferences = {
  stops: "direct" as const,
  times: ["morning" as const],
  airlines: ["EK"],
  bag: "30" as const,
  refundableOnly: false,
};

describe("contact step", () => {
  it("accepts a local Bangladeshi number and an optional email", () => {
    const result = contactStepSchema(false).safeParse({
      name: "Sample Rahim",
      phoneCountry: "BD",
      phone: "01712-345678",
      email: "",
    });
    expect(result.success).toBe(true);
  });

  it("names every problem with its message key", () => {
    const result = contactStepSchema(true).safeParse({
      name: "R",
      phoneCountry: "BD",
      phone: "0171",
      email: "",
    });
    expect(result.success).toBe(false);
    const issues = Object.fromEntries(
      (result.error?.issues ?? []).map((i) => [i.path.join("."), i.message]),
    );
    expect(issues).toMatchObject({
      name: "nameRequired",
      phone: "phoneInvalid",
      email: "emailRequired",
    });
  });
});

describe("trip step", () => {
  it("prefills from the URL search and a group fare's fixed date", () => {
    expect(tripDefaults(search)).toMatchObject({
      from: "DAC",
      to: "DXB",
      depart: "2026-10-22",
      return: "2026-10-29",
    });
    expect(tripDefaults(search, "2026-11-14").depart).toBe("2026-11-14");
    expect(tripDefaults(null)).toMatchObject({ from: "", to: "", depart: "" });
  });

  it("requires consent and a return on or after departure", () => {
    const result = tripStepSchema.safeParse({
      ...tripDefaults(search),
      return: "2026-10-01",
      consent: false,
    });
    const messages = (result.error?.issues ?? []).map((i) => i.message);
    expect(messages).toEqual(expect.arrayContaining(["consentRequired", "returnBeforeDepart"]));
  });
});

describe("buildFlightLead", () => {
  it("produces a lead that passes the shared contract, with E.164 phone and preferences", () => {
    const trip = tripStepSchema.parse({
      ...tripDefaults(search),
      consent: true,
      notes: "  Travelling with a baby  ",
    });
    const lead = buildFlightLead({
      contact: { name: "Sample Rahim", phoneCountry: "BD", phone: "01712-345678", email: "" },
      trip,
      search,
      preferences,
      groupFareId: "gf-ek-dxb-1114",
      page: "/flights",
    });
    const parsed = LeadCreateInputSchema.parse(lead);
    expect(parsed.contact.phone).toBe("+8801712345678");
    expect(parsed.payload).toMatchObject({
      module: "flights",
      groupFareId: "gf-ek-dxb-1114",
      notes: "Travelling with a baby",
    });
    if (parsed.payload.module !== "flights") throw new Error("module");
    expect(parsed.payload.search).toMatchObject({
      tripType: "round-trip",
      returnDate: "2026-10-29",
      directOnly: true,
    });
    expect(parsed.payload.search.travellers).toEqual({ adults: 2, childAges: [7], infants: 0 });
  });
});
