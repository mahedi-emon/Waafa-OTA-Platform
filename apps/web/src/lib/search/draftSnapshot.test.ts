import type { Airport } from "@waafa/shared";
import { describe, expect, it } from "vitest";
import { parseDraft, serializeDraft } from "./draftSnapshot";
import {
  initialSearchState,
  searchReducer,
  type SearchAction,
  type SearchState,
} from "./searchState";

const airport = (iata: string, city: string, countryCode: string): Airport => ({
  iata,
  city,
  name: `${city} Airport`,
  country: countryCode === "BD" ? "Bangladesh" : "Abroad",
  countryCode,
});
const run = (state: SearchState, ...actions: SearchAction[]) =>
  actions.reduce(searchReducer, state);

describe("draft snapshot", () => {
  it("round-trips what the visitor entered and restores it without pickers or errors", () => {
    const entered = run(
      initialSearchState({ origin: airport("DAC", "Dhaka", "BD") }),
      { type: "trip", trip: "round-trip" },
      { type: "open", key: "to" },
      { type: "pickAirport", airport: airport("DXB", "Dubai", "AE") },
      { type: "pickDate", iso: "2026-10-22" },
      { type: "pickDate", iso: "2026-10-29" },
      { type: "count", field: "children", delta: 1 },
      { type: "childAge", scope: "flight", index: 0, age: 6 },
    );
    const draft = parseDraft(serializeDraft(entered));
    expect(draft).not.toBeNull();

    const fresh = run(initialSearchState({ origin: null }), { type: "open", key: "from" });
    const restored = searchReducer(fresh, { type: "restore", draft: draft! });
    expect(restored.picker).toBeNull();
    expect(restored.errors).toEqual({});
    expect(restored.flight).toEqual(entered.flight);
  });

  it("ignores missing, malformed or edited snapshots", () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft("not json")).toBeNull();
    const draft = JSON.parse(serializeDraft(initialSearchState({ origin: null })));
    draft.flight.adults = 40;
    expect(parseDraft(JSON.stringify(draft))).toBeNull();
  });
});
