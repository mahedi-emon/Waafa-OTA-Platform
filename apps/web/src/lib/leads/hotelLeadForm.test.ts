import { LeadCreateInputSchema, type HotelSearch } from "@waafa/shared";
import { describe, expect, it } from "vitest";
import { buildHotelLead, stayDefaults, stayStepSchema } from "./hotelLeadForm";

const search: HotelSearch = {
  placeId: "city-coxs-bazar",
  placeLabel: "Cox’s Bazar",
  checkIn: "2026-11-14",
  checkOut: "2026-11-16",
  rooms: [{ adults: 2, childAges: [] }],
  nationality: "BD",
};

describe("stay step", () => {
  it("prefills from the URL search", () => {
    expect(stayDefaults(search)).toMatchObject({
      place: "Cox’s Bazar",
      checkin: "2026-11-14",
      checkout: "2026-11-16",
    });
  });

  it("reports every problem at once, including the 30-night cap", () => {
    const empty = stayStepSchema.safeParse({ ...stayDefaults(null), consent: false });
    expect((empty.error?.issues ?? []).map((i) => i.message)).toEqual(
      expect.arrayContaining([
        "placeRequired",
        "checkinRequired",
        "checkoutRequired",
        "consentRequired",
      ]),
    );
    const long = stayStepSchema.safeParse({
      ...stayDefaults(search),
      checkout: "2027-01-20",
      consent: true,
    });
    expect(long.error?.issues[0]?.message).toBe("stayTooLong");
    const backwards = stayStepSchema.safeParse({
      ...stayDefaults(search),
      checkout: "2026-11-14",
      consent: true,
    });
    expect(backwards.error?.issues[0]?.message).toBe("checkoutAfterCheckin");
  });
});

describe("buildHotelLead", () => {
  it("keeps the place id from the URL and passes the shared contract", () => {
    const stay = stayStepSchema.parse({
      ...stayDefaults(search),
      budgetBand: "5000-10000",
      meals: "breakfast",
      consent: true,
    });
    const lead = LeadCreateInputSchema.parse(
      buildHotelLead({
        contact: { name: "Sample Karim", phoneCountry: "BD", phone: "01812-345678", email: "" },
        stay,
        search,
        preferences: { seaView: true, freeCancellation: false },
        page: "/hotels",
      }),
    );
    expect(lead.payload).toMatchObject({
      module: "hotels",
      budgetBand: "5000-10000",
      meals: "breakfast",
      seaView: true,
    });
    if (lead.payload.module !== "hotels") throw new Error("module");
    expect(lead.payload.search.placeId).toBe("city-coxs-bazar");
    expect(lead.contact.phone).toBe("+8801812345678");
  });

  it("marks a typed place that differs from the search", () => {
    const stay = stayStepSchema.parse({ ...stayDefaults(search), place: "Sylhet", consent: true });
    const lead = buildHotelLead({
      contact: { name: "Sample Karim", phoneCountry: "BD", phone: "01812-345678", email: "" },
      stay,
      search,
      preferences: { seaView: false, freeCancellation: false },
      page: "/hotels",
    });
    if (lead.payload.module !== "hotels") throw new Error("module");
    expect(lead.payload.search).toMatchObject({ placeId: "typed", placeLabel: "Sylhet" });
  });

  it("sends the rooms, guests, class and best time from the step (#51)", () => {
    const stay = stayStepSchema.parse({
      ...stayDefaults(null),
      place: "Sylhet",
      checkin: "2026-11-14",
      checkout: "2026-11-16",
      guests: { rooms: 2, adults: 3, childAges: [6] },
      stars: "4",
      bestTime: "morning",
      consent: true,
    });
    const lead = LeadCreateInputSchema.parse(
      buildHotelLead({
        contact: { name: "Sample Karim", phoneCountry: "BD", phone: "01812-345678", email: "" },
        stay,
        search: null,
        preferences: { seaView: false, freeCancellation: false },
        page: "/hotels",
      }),
    );
    if (lead.payload.module !== "hotels") throw new Error("module");
    expect(lead.payload.search.rooms).toEqual([
      { adults: 2, childAges: [] },
      { adults: 1, childAges: [6] },
    ]);
    expect(lead.payload.starPreference).toBe("4");
    expect(lead.contact.bestTime).toBe("morning");
  });

  it("needs an adult in every room", () => {
    const result = stayStepSchema.safeParse({
      ...stayDefaults(search),
      guests: { rooms: 3, adults: 2, childAges: [] },
      consent: true,
    });
    expect(result.error?.issues.map((issue) => issue.message)).toContain("adultPerRoom");
  });
});
