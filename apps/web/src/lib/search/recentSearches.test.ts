import { describe, expect, it } from "vitest";
import {
  MAX_RECENT_PER_MODULE,
  RECENT_SEARCHES_KEY,
  addRecentSearch,
  loadRecentSearches,
  parseRecentSearches,
  recentAirports,
  recentForModule,
  saveRecentSearch,
  type RecentSearch,
} from "./recentSearches";

const dac = {
  iata: "DAC",
  city: "Dhaka",
  name: "Hazrat Shahjalal International Airport",
  country: "Bangladesh",
  countryCode: "BD",
};
const dxb = {
  iata: "DXB",
  city: "Dubai",
  name: "Dubai International Airport",
  country: "United Arab Emirates",
  countryCode: "AE",
};
const kul = {
  iata: "KUL",
  city: "Kuala Lumpur",
  name: "Kuala Lumpur International Airport",
  country: "Malaysia",
  countryCode: "MY",
};

const flight = (href: string, at: number, airports = [dac, dxb]): RecentSearch => ({
  module: "flights",
  label: href,
  href,
  at,
  airports,
});

function memoryStorage(initial?: string) {
  const store = new Map<string, string>(initial ? [[RECENT_SEARCHES_KEY, initial]] : []);
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    dump: () => store.get(RECENT_SEARCHES_KEY),
  };
}

describe("recent searches (FR-SRCH-09)", () => {
  it("keeps the newest first, one entry per URL and three per module", () => {
    let list: RecentSearch[] = [];
    for (let index = 0; index < 5; index += 1)
      list = addRecentSearch(list, flight(`/flights?n=${index}`, index));
    list = addRecentSearch(list, flight("/flights?n=3", 99));
    expect(list.map((item) => item.href)).toEqual(["/flights?n=3", "/flights?n=4", "/flights?n=2"]);
    expect(list).toHaveLength(MAX_RECENT_PER_MODULE);
    list = addRecentSearch(list, {
      module: "visa",
      label: "Thailand",
      href: "/visa-services/thailand",
      at: 100,
    });
    expect(recentForModule(list, "visa")).toHaveLength(1);
    expect(recentForModule(list, "flights")).toHaveLength(3);
  });

  it("ignores broken or tampered storage", () => {
    expect(parseRecentSearches("not json")).toEqual([]);
    for (const href of ["//evil.example/x", "/\\evil.example", "https://evil.example"]) {
      expect(
        parseRecentSearches(JSON.stringify([{ module: "visa", label: "X", href, at: 1 }])),
      ).toEqual([]);
    }
    expect(
      parseRecentSearches(
        JSON.stringify([{ module: "visa", label: "X", href: "/visa-services/thailand", at: 1 }]),
      ),
    ).toHaveLength(1);
    expect(parseRecentSearches(JSON.stringify({ module: "flights" }))).toEqual([]);
    expect(
      parseRecentSearches(
        JSON.stringify([
          { module: "flights", label: "x", href: "https://evil.example", at: 1 },
          flight("/flights", 2),
        ]),
      ),
    ).toHaveLength(1);
  });

  it("lists recent airports without repeats, skipping the one already chosen", () => {
    const list = [flight("/a", 2, [dac, kul]), flight("/b", 1, [dac, dxb])];
    expect(recentAirports(list).map((airport) => airport.iata)).toEqual(["DAC", "KUL", "DXB"]);
    expect(recentAirports(list, ["DAC"]).map((airport) => airport.iata)).toEqual(["KUL", "DXB"]);
  });

  it("saves through storage and survives storage that throws", () => {
    const storage = memoryStorage();
    saveRecentSearch(storage, flight("/flights?x=1", 1));
    expect(loadRecentSearches(storage)).toHaveLength(1);
    expect(storage.dump()).toContain("/flights?x=1");
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(loadRecentSearches(broken)).toEqual([]);
    expect(saveRecentSearch(broken, flight("/flights", 1))).toHaveLength(1);
    expect(loadRecentSearches(undefined)).toEqual([]);
  });
});
