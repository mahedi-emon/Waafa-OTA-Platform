import type { Airport, HotelPlace } from "@waafa/shared";
import { describe, expect, it } from "vitest";
import {
  countLimits,
  firstErrorField,
  initialSearchState,
  searchReducer,
  validateFlight,
  validateHotel,
  validateVisa,
  type SearchAction,
  type SearchState,
  type VisaCountryOption,
} from "./searchState";

const airport = (iata: string, city: string, countryCode = "BD"): Airport => ({
  iata,
  city,
  name: `${city} Airport`,
  country: countryCode === "BD" ? "Bangladesh" : "Abroad",
  countryCode,
});
const DAC = airport("DAC", "Dhaka");
const CXB = airport("CXB", "Cox’s Bazar");
const DXB = airport("DXB", "Dubai", "AE");
const IST = airport("IST", "Istanbul", "TR");
const TODAY = "2026-10-10";

const run = (state: SearchState, ...actions: SearchAction[]) =>
  actions.reduce(searchReducer, state);
const start = () => initialSearchState({ origin: DAC });

describe("search card: flights", () => {
  it("starts from the default origin and auto-advances From → To → Dates", () => {
    let state = start();
    expect(state.flight.from?.iata).toBe("DAC");
    state = run(state, { type: "open", key: "to" }, { type: "pickAirport", airport: DXB });
    expect(state.flight.to?.iata).toBe("DXB");
    expect(state.picker).toMatchObject({ key: "dates", focus: "start" });
  });

  it("swaps instead of allowing the same airport on both sides", () => {
    let state = run(start(), { type: "open", key: "to" }, { type: "pickAirport", airport: DXB });
    state = run(state, { type: "open", key: "from" }, { type: "pickAirport", airport: DXB });
    expect([state.flight.from?.iata, state.flight.to?.iata]).toEqual(["DXB", "DAC"]);
    state = run(state, { type: "swap" }, { type: "swap" });
    expect([state.flight.from?.iata, state.flight.to?.iata]).toEqual(["DXB", "DAC"]);
    expect(state.swaps).toBe(2);
  });

  it("picks a round trip as a range and keeps a later return when departure moves", () => {
    let state = run(start(), { type: "trip", trip: "round-trip" }, { type: "open", key: "dates" });
    state = run(state, { type: "pickDate", iso: "2026-10-22" });
    expect(state.picker?.focus).toBe("end");
    state = run(state, { type: "pickDate", iso: "2026-10-29" });
    expect([state.flight.depart, state.flight.return]).toEqual(["2026-10-22", "2026-10-29"]);
    state = run(
      state,
      { type: "focusDate", focus: "start" },
      { type: "pickDate", iso: "2026-10-25" },
    );
    expect([state.flight.depart, state.flight.return]).toEqual(["2026-10-25", "2026-10-29"]);
    state = run(
      state,
      { type: "focusDate", focus: "start" },
      { type: "pickDate", iso: "2026-11-02" },
    );
    expect([state.flight.depart, state.flight.return]).toEqual(["2026-11-02", null]);
  });

  it("turns Add return into a round trip with the calendar on the return date", () => {
    let state = run(
      start(),
      { type: "open", key: "dates" },
      { type: "pickDate", iso: "2026-10-22" },
    );
    state = run(state, { type: "addReturn" });
    expect(state.flight.trip).toBe("round-trip");
    expect(state.picker).toMatchObject({ key: "dates", focus: "end" });
  });

  it("builds multi-city legs, chains airports and keeps dates in order", () => {
    let state = run(
      start(),
      { type: "open", key: "to" },
      { type: "pickAirport", airport: DXB },
      { type: "pickDate", iso: "2026-10-22" },
      { type: "trip", trip: "multi-city" },
    );
    expect(state.flight.legs).toHaveLength(2);
    expect(state.flight.legs[1]?.from?.iata).toBe("DXB");
    state = run(state, { type: "open", key: "to", leg: 1 }, { type: "pickAirport", airport: IST });
    expect(state.picker).toMatchObject({ key: "dates", leg: 1 });
    state = run(state, { type: "pickDate", iso: "2026-10-27" }, { type: "addLeg" });
    expect(state.flight.legs[2]).toMatchObject({ date: "2026-10-30", to: null });
    expect(state.flight.legs[2]?.from?.iata).toBe("IST");
    state = run(
      state,
      { type: "open", key: "dates", leg: 0 },
      { type: "pickDate", iso: "2026-10-28" },
    );
    expect(state.flight.legs.map((leg) => leg.date)).toEqual([
      "2026-10-28",
      "2026-10-28",
      "2026-10-30",
    ]);
    for (let index = 0; index < 5; index += 1) state = run(state, { type: "addLeg" });
    expect(state.flight.legs).toHaveLength(5);
    state = run(
      state,
      { type: "removeLeg", index: 4 },
      { type: "removeLeg", index: 3 },
      { type: "removeLeg", index: 2 },
    );
    state = run(state, { type: "removeLeg", index: 1 });
    expect(state.flight.legs).toHaveLength(2);
    state = run(state, { type: "trip", trip: "one-way" });
    expect([state.flight.from?.iata, state.flight.to?.iata, state.flight.depart]).toEqual([
      "DAC",
      "DXB",
      "2026-10-28",
    ]);
  });

  it("caps travellers at nine and infants at the number of adults (FR-SRCH-02)", () => {
    let state = start();
    for (let index = 0; index < 12; index += 1)
      state = run(state, { type: "count", field: "adults", delta: 1 });
    expect(state.flight.adults).toBe(9);
    expect(countLimits(state, "children").max).toBe(0);
    state = run(
      state,
      ...Array.from({ length: 6 }, () => ({ type: "count", field: "adults", delta: -1 }) as const),
    );
    state = run(
      state,
      ...Array.from({ length: 5 }, () => ({ type: "count", field: "infants", delta: 1 }) as const),
    );
    expect([state.flight.adults, state.flight.infants]).toEqual([3, 3]);
    state = run(state, { type: "count", field: "adults", delta: -1 });
    expect([state.flight.adults, state.flight.infants]).toEqual([2, 2]);
    state = run(state, { type: "count", field: "children", delta: 1 });
    expect(state.flight.childAges).toEqual([null]);
    expect(validateFlight(state.flight, TODAY).travellers).toBe("childAgeRequired");
    state = run(state, { type: "childAge", scope: "flight", index: 0, age: 7 });
    expect(validateFlight(state.flight, TODAY).travellers).toBeUndefined();
  });

  it("names the missing and wrong fields in reading order (FR-SRCH-08)", () => {
    const empty = validateFlight(start().flight, TODAY);
    expect(empty).toEqual({ to: "toRequired", depart: "departRequired" });
    expect(firstErrorField(empty)).toBe("to");
    const state = run(
      start(),
      { type: "trip", trip: "round-trip" },
      { type: "open", key: "to" },
      { type: "pickAirport", airport: CXB },
      { type: "pickDate", iso: "2026-10-01" },
    );
    expect(validateFlight(state.flight, TODAY)).toEqual({
      depart: "departPast",
      return: "returnRequired",
    });
  });

  it("clears a field's error once the visitor fixes it", () => {
    let state = run(start(), { type: "errors", errors: validateFlight(start().flight, TODAY) });
    state = run(state, { type: "open", key: "to" }, { type: "pickAirport", airport: DXB });
    expect(state.errors).toEqual({ depart: "departRequired" });
  });

  it("sends a popular chip to To and opens the calendar when no date is set", () => {
    let state = run(start(), { type: "popularFlight", airport: CXB });
    expect(state.flight.to?.iata).toBe("CXB");
    expect(state.picker?.key).toBe("dates");
    state = run(start(), { type: "popularFlight", airport: DAC });
    expect(state.flight.to).toBeNull();
  });
});

describe("search card: hotels, tours and visa", () => {
  const place: HotelPlace = {
    id: "city-coxs-bazar",
    kind: "city",
    name: "Cox’s Bazar",
    city: "Cox’s Bazar",
    country: "Bangladesh",
    popular: true,
  };

  it("chains place → stay and enforces at least one night and at most thirty", () => {
    let state = run(start(), { type: "tab", tab: "hotel" }, { type: "open", key: "place" });
    state = run(state, { type: "pickPlace", place });
    expect(state.picker?.key).toBe("stay");
    state = run(
      state,
      { type: "pickDate", iso: "2026-12-01" },
      { type: "pickDate", iso: "2026-12-01" },
    );
    expect([state.hotel.checkin, state.hotel.checkout]).toEqual(["2026-12-01", null]);
    state = run(state, { type: "pickDate", iso: "2027-01-15" });
    expect(state.hotel.checkout).toBeNull();
    state = run(
      state,
      { type: "focusDate", focus: "end" },
      { type: "pickDate", iso: "2026-12-04" },
    );
    expect(state.hotel.checkout).toBe("2026-12-04");
    expect(validateHotel(state.hotel, TODAY)).toEqual({});
  });

  it("keeps at least one adult per room and caps children per room", () => {
    let state = start();
    for (let index = 0; index < 4; index += 1)
      state = run(state, { type: "count", field: "rooms", delta: 1 });
    expect([state.hotel.rooms, state.hotel.adults]).toEqual([5, 5]);
    expect(countLimits(state, "hotelAdults")).toMatchObject({ min: 5, max: 30 });
    expect(countLimits(state, "hotelChildren").max).toBe(8);
  });

  it("walks the tour and visa pickers in order and keeps a valid visa type", () => {
    let state = run(
      start(),
      { type: "tab", tab: "tour" },
      { type: "pickDestination", destination: null, search: "tea gardens" },
    );
    expect(state.picker?.key).toBe("month");
    state = run(state, { type: "pickMonth", month: "2026-12" });
    expect(state.picker?.key).toBe("party");
    const malaysia: VisaCountryOption = {
      slug: "malaysia",
      name: "Malaysia",
      flagCode: "MY",
      region: "south-east-asia",
      popular: true,
      types: ["business", "medical"],
    };
    expect(validateVisa(state.visa)).toEqual({ country: "countryRequired" });
    state = run(state, { type: "tab", tab: "visa" }, { type: "pickCountry", country: malaysia });
    expect(state.visa.type).toBe("business");
    expect(state.picker?.key).toBe("visaType");
    expect(validateVisa(state.visa)).toEqual({});
  });
});
