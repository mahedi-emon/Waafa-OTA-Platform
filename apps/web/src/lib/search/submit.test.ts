import type { Airport, HotelPlace } from "@waafa/shared";
import { describe, expect, it } from "vitest";
import { loadFlightSearch, parseFlightValues } from "./flightParams";
import { loadHotelSearch, parseHotelValues } from "./hotelParams";
import {
  initialSearchState,
  searchReducer,
  type SearchAction,
  type SearchState,
} from "./searchState";
import {
  deviceForWidth,
  submitSearch,
  toRecentSearch,
  toSearchLog,
  type SubmitLabels,
} from "./submit";

const airport = (iata: string, city: string, countryCode = "BD"): Airport => ({
  iata,
  city,
  name: `${city} Airport`,
  country: countryCode === "BD" ? "Bangladesh" : "Abroad",
  countryCode,
});
const DAC = airport("DAC", "Dhaka");
const DXB = airport("DXB", "Dubai", "AE");
const IST = airport("IST", "Istanbul", "TR");
const TODAY = "2026-10-10";
const LABELS: SubmitLabels = {
  visaTypes: {
    tourist: "Tourist",
    business: "Business",
    student: "Student",
    medical: "Medical",
    transit: "Transit",
  },
  anyMonth: "Any month",
};

const run = (state: SearchState, ...actions: SearchAction[]) =>
  actions.reduce(searchReducer, state);
const start = () => initialSearchState({ origin: DAC });
const query = (href: string) => new URLSearchParams(href.split("?")[1] ?? "");

describe("submitSearch: flights", () => {
  it("returns field errors instead of a URL when the trip is incomplete", () => {
    const result = submitSearch(start(), TODAY, LABELS);
    expect(result).toEqual({ ok: false, errors: { to: "toRequired", depart: "departRequired" } });
  });

  it("builds a one-way URL that the results page parses back to the same trip", () => {
    const state = run(
      start(),
      { type: "open", key: "to" },
      { type: "pickAirport", airport: DXB },
      { type: "pickDate", iso: "2026-10-22" },
      { type: "count", field: "children", delta: 1 },
      { type: "childAge", scope: "flight", index: 0, age: 7 },
    );
    const result = submitSearch(state, TODAY, LABELS);
    if (!result.ok) throw new Error("expected a valid search");
    const { submission } = result;
    expect(submission.href).toBe("/flights?from=DAC&to=DXB&depart=2026-10-22&children=7");
    expect(submission.summary).toBe("DAC → DXB · 22 Oct");
    expect(submission.airports?.map((a) => a.iata)).toEqual(["DAC", "DXB"]);

    const back = parseFlightValues(loadFlightSearch(query(submission.href)));
    expect(back.success && back.data.travellers).toEqual({ adults: 1, childAges: [7], infants: 0 });
  });

  it("keeps the return date, options and airline on a round trip", () => {
    const state = run(
      start(),
      { type: "trip", trip: "round-trip" },
      { type: "open", key: "to" },
      { type: "pickAirport", airport: DXB },
      { type: "pickDate", iso: "2026-10-22" },
      { type: "pickDate", iso: "2026-10-29" },
      { type: "cabin", cabin: "business" },
      { type: "toggle", option: "direct" },
      { type: "airline", code: "EK" },
    );
    const result = submitSearch(state, TODAY, LABELS);
    if (!result.ok) throw new Error("expected a valid search");
    const params = query(result.submission.href);
    expect(params.get("trip")).toBe("round-trip");
    expect(params.get("return")).toBe("2026-10-29");
    expect(params.get("cabin")).toBe("business");
    expect(params.get("direct")).toBe("true");
    expect(params.get("airline")).toBe("EK");
    expect(result.submission.summary).toBe("DAC ⇄ DXB · 22 Oct – 29 Oct");
  });

  it("serialises multi-city legs in order", () => {
    let state = run(start(), { type: "trip", trip: "multi-city" });
    state = run(
      state,
      { type: "open", key: "to", leg: 0 },
      { type: "pickAirport", airport: DXB },
      { type: "pickDate", iso: "2026-10-22" },
      { type: "open", key: "to", leg: 1 },
      { type: "pickAirport", airport: IST },
      { type: "pickDate", iso: "2026-10-27" },
    );
    const result = submitSearch(state, TODAY, LABELS);
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    expect(query(result.submission.href).get("legs")).toBe("DAC-DXB-2026-10-22,DXB-IST-2026-10-27");
    expect(result.submission.summary).toBe("DAC → DXB → IST · 22 Oct");
  });
});

describe("submitSearch: hotels, tours and visa", () => {
  const place: HotelPlace = {
    id: "city-coxs-bazar",
    kind: "city",
    name: "Cox’s Bazar",
    city: "Cox’s Bazar",
    country: "Bangladesh",
    popular: true,
  };

  it("builds a hotel URL with rooms, guests and nationality that parses back", () => {
    const state = run(
      start(),
      { type: "tab", tab: "hotel" },
      { type: "open", key: "place" },
      { type: "pickPlace", place },
      { type: "pickDate", iso: "2026-12-01" },
      { type: "pickDate", iso: "2026-12-04" },
      { type: "count", field: "rooms", delta: 1 },
    );
    const result = submitSearch(state, TODAY, LABELS);
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    expect(result.submission.summary).toBe("Cox’s Bazar · 1 Dec – 4 Dec");
    const back = parseHotelValues(loadHotelSearch(query(result.submission.href)));
    expect(back.success && back.data.rooms).toEqual([
      { adults: 1, childAges: [] },
      { adults: 1, childAges: [] },
    ]);
  });

  it("sends a tour search to /tour-packages with free text when no destination was picked", () => {
    const state = run(
      start(),
      { type: "tab", tab: "tour" },
      { type: "pickDestination", destination: null, search: "Sajek" },
      { type: "pickMonth", month: "2026-12" },
    );
    const result = submitSearch(state, TODAY, LABELS);
    if (!result.ok) throw new Error("tour searches are always valid");
    expect(result.submission.href).toBe("/tour-packages?search=Sajek&month=2026-12");
    expect(result.submission.summary).toBe("Sajek · Dec 2026");
  });

  it("requires a country for visa and opens the country page", () => {
    const empty = run(start(), { type: "tab", tab: "visa" });
    expect(submitSearch(empty, TODAY, LABELS)).toEqual({
      ok: false,
      errors: { country: "countryRequired" },
    });
    const state = run(empty, {
      type: "pickCountry",
      country: {
        slug: "thailand",
        name: "Thailand",
        flagCode: "TH",
        region: "asia",
        popular: true,
        types: ["tourist"],
      },
    });
    const result = submitSearch(state, TODAY, LABELS);
    if (!result.ok) throw new Error("expected a valid search");
    expect(result.submission.href).toBe("/visa-services/thailand");
    expect(result.submission.summary).toBe("Thailand · Tourist");
  });
});

describe("recent and log payloads", () => {
  it("maps a submission to a recent chip and a search log", () => {
    const submission = {
      module: "visa" as const,
      href: "/visa-services/thailand",
      summary: "Thailand · Tourist",
      params: { country: "thailand" },
    };
    expect(toRecentSearch(submission, 5)).toEqual({
      module: "visa",
      label: "Thailand · Tourist",
      href: "/visa-services/thailand",
      at: 5,
    });
    expect(toSearchLog(submission, "phone", "")).toMatchObject({ device: "phone", source: "/" });
  });

  it("classifies devices by width", () => {
    expect([deviceForWidth(390), deviceForWidth(800), deviceForWidth(1440)]).toEqual([
      "phone",
      "tablet",
      "desktop",
    ]);
  });
});
