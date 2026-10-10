import { describe, expect, it } from "vitest";
import {
  flightSearchHref,
  flightSearchParams,
  loadFlightSearch,
  parseFlightValues,
  serializeFlightSearch,
} from "./flightParams";
import {
  distributeGuests,
  hotelSearchHref,
  loadHotelSearch,
  parseHotelValues,
} from "./hotelParams";
import { loadTourSearch, tourSearchHref } from "./tourParams";
import { loadVisaSearch, visaSearchHref } from "./visaParams";
import { parseAsLeg } from "./parsers";

const url = (href: string) => new URL(href, "https://waafa.example");

describe("flight search URL (FR-SRCH-09)", () => {
  it("keeps defaults out of a one-way search URL", () => {
    expect(
      serializeFlightSearch("/flights", {
        trip: "one-way",
        from: "DAC",
        to: "DXB",
        depart: "2026-10-22",
        adults: 1,
        cabin: "economy",
      }),
    ).toBe("/flights?from=DAC&to=DXB&depart=2026-10-22");
  });

  it("round-trips a full round-trip search through the URL", () => {
    const parsed = parseFlightValues(
      loadFlightSearch(
        url(
          "/flights?trip=round-trip&from=dac&to=dxb&depart=2026-10-22&return=2026-10-29&adults=2&children=5,9&infants=1&cabin=business&direct=true&flex=true&fare=student&airline=ek",
        ),
      ),
    );
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data).toMatchObject({
      tripType: "round-trip",
      legs: [{ from: "DAC", to: "DXB", date: "2026-10-22" }],
      returnDate: "2026-10-29",
      travellers: { adults: 2, childAges: [5, 9], infants: 1 },
      cabin: "business",
      directOnly: true,
      flexibleDates: true,
      fareType: "student",
      preferredAirline: "EK",
    });
    const again = parseFlightValues(loadFlightSearch(url(flightSearchHref(parsed.data))));
    expect(again.success && again.data).toEqual(parsed.data);
  });

  it("reads and writes multi-city legs", () => {
    const href =
      "/flights?trip=multi-city&legs=DAC-DXB-2026-10-22,DXB-IST-2026-10-27,IST-DAC-2026-11-03";
    const parsed = parseFlightValues(loadFlightSearch(url(href)));
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.legs).toHaveLength(3);
    expect(flightSearchHref(parsed.data)).toBe(
      "/flights?trip=multi-city&legs=DAC-DXB-2026-10-22,DXB-IST-2026-10-27,IST-DAC-2026-11-03",
    );
  });

  it("drops malformed values instead of trusting them", () => {
    const values = loadFlightSearch(
      url("/flights?from=DHAKA&to=DXB&depart=2026-02-30&cabin=luxury&trip=space"),
    );
    expect(values.from).toBeNull();
    expect(values.depart).toBeNull();
    expect(values.cabin).toBe(flightSearchParams.cabin.defaultValue);
    expect(values.trip).toBe("one-way");
    expect(parseFlightValues(values).success).toBe(false);
  });

  it("rejects the same airport twice, a return before departure and more than nine travellers (FR-SRCH-08)", () => {
    const base = { from: "DAC", depart: "2026-10-22" } as const;
    expect(
      parseFlightValues(loadFlightSearch(url("/flights?from=DAC&to=DAC&depart=2026-10-22")))
        .success,
    ).toBe(false);
    expect(
      parseFlightValues(
        loadFlightSearch(
          url(
            `/flights?trip=round-trip&from=${base.from}&to=DXB&depart=${base.depart}&return=2026-10-20`,
          ),
        ),
      ).success,
    ).toBe(false);
    expect(
      parseFlightValues(
        loadFlightSearch(
          url("/flights?from=DAC&to=DXB&depart=2026-10-22&adults=6&children=4,5,6,7"),
        ),
      ).success,
    ).toBe(false);
    expect(
      parseFlightValues(
        loadFlightSearch(url("/flights?from=DAC&to=DXB&depart=2026-10-22&adults=1&infants=2")),
      ).success,
    ).toBe(false);
  });

  it("parses a leg only when the date is real", () => {
    expect(parseAsLeg.parse("dac-cxb-2026-12-01")).toEqual({
      from: "DAC",
      to: "CXB",
      date: "2026-12-01",
    });
    expect(parseAsLeg.parse("DAC-CXB-2026-13-01")).toBeNull();
    expect(parseAsLeg.parse("DACCXB2026")).toBeNull();
  });
});

describe("hotel search URL", () => {
  it("spreads guests across rooms, adults first, children to the emptiest room", () => {
    expect(distributeGuests(2, 5, [4, 9])).toEqual([
      { adults: 3, childAges: [9] },
      { adults: 2, childAges: [4] },
    ]);
    expect(distributeGuests(1, 2, [])).toEqual([{ adults: 2, childAges: [] }]);
  });

  it("round-trips a search and validates the stay (FR-SRCH-03)", () => {
    const values = loadHotelSearch(
      url(
        "/hotels?place=city-coxs-bazar&placeName=Cox%E2%80%99s+Bazar&checkin=2026-12-01&checkout=2026-12-04&rooms=2&adults=3&children=6",
      ),
    );
    const parsed = parseHotelValues(values);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.placeLabel).toBe("Cox’s Bazar");
    expect(parsed.data.rooms).toHaveLength(2);
    expect(parsed.data.nationality).toBe("BD");
    const again = parseHotelValues(loadHotelSearch(url(hotelSearchHref(parsed.data))));
    expect(again.success && again.data).toEqual(parsed.data);
  });

  it("rejects a stay over 30 nights or a check-out before check-in", () => {
    const stay = (checkin: string, checkout: string) =>
      parseHotelValues(
        loadHotelSearch(url(`/hotels?place=p&placeName=P&checkin=${checkin}&checkout=${checkout}`)),
      ).success;
    expect(stay("2026-12-01", "2026-12-01")).toBe(false);
    expect(stay("2026-12-01", "2027-01-05")).toBe(false);
    expect(stay("2026-12-01", "2026-12-31")).toBe(true);
  });
});

describe("tour and visa URLs (FR-SRCH-04, FR-SRCH-05)", () => {
  it("prefers a picked destination over free text and keeps defaults out", () => {
    expect(tourSearchHref({ destination: "maldives", search: "male", month: "2026-12" })).toBe(
      "/tour-packages?destination=maldives&month=2026-12",
    );
    expect(tourSearchHref({ search: "  tea gardens ", adults: 3, children: 1 })).toBe(
      "/tour-packages?search=tea+gardens&adults=3&children=1",
    );
    expect(
      loadTourSearch(url("/tour-packages?month=2026-13&destination=Not+A+Slug")),
    ).toMatchObject({
      month: null,
      destination: null,
      adults: 2,
    });
  });

  it("opens the country page with type and applicants", () => {
    expect(visaSearchHref("thailand", "tourist", 1)).toBe("/visa-services/thailand");
    expect(visaSearchHref("malaysia", "medical", 3)).toBe(
      "/visa-services/malaysia?type=medical&applicants=3",
    );
    expect(visaSearchHref("india", "business", 40)).toBe(
      "/visa-services/india?type=business&applicants=10",
    );
    expect(loadVisaSearch(url("/visa-services/india?type=work"))).toMatchObject({
      type: "tourist",
    });
  });
});
