import {
  MAX_HOTEL_NIGHTS,
  MAX_HOTEL_ROOMS,
  MAX_MULTI_CITY_LEGS,
  MAX_TRAVELLERS,
  daysBetween,
  type Airport,
  type HotelPlace,
  type VisaTypeKey,
} from "@waafa/shared";
import type { CabinClass, FareType, TripType } from "./flightParams";
import { addDays } from "./isoDate";
import { MAX_TOUR_ADULTS, MAX_TOUR_CHILDREN } from "./tourParams";
import { MAX_VISA_APPLICANTS } from "./visaParams";

/*
 * The search card's state machine (FR-SRCH-01 to FR-SRCH-08), kept free of React so every rule is
 * unit-tested: auto-advance between pickers, swaps, date ranges, traveller limits and multi-city legs.
 */

export type SearchTab = "flight" | "hotel" | "tour" | "visa";

export type DestinationOption = {
  slug: string;
  name: string;
  subtitle: string;
  domestic: boolean;
  /** ISO country code for the flag, when the airport behind the destination is known. */
  countryCode: string | null;
};

export type VisaCountryOption = {
  slug: string;
  name: string;
  flagCode: string;
  region: string;
  popular: boolean;
  types: VisaTypeKey[];
};

export type FlightLegDraft = { from: Airport | null; to: Airport | null; date: string | null };

export type FlightDraft = {
  trip: TripType;
  from: Airport | null;
  to: Airport | null;
  depart: string | null;
  return: string | null;
  legs: FlightLegDraft[];
  adults: number;
  /** One entry per child; null until the age is chosen. */
  childAges: Array<number | null>;
  infants: number;
  cabin: CabinClass;
  direct: boolean;
  flex: boolean;
  fare: FareType;
  airline: string | null;
};

export type HotelDraft = {
  place: HotelPlace | null;
  checkin: string | null;
  checkout: string | null;
  rooms: number;
  adults: number;
  childAges: Array<number | null>;
  nationality: string;
};

export type TourDraft = {
  destination: DestinationOption | null;
  /** Free text when nothing in the list fits. */
  search: string;
  /** "2026-12", or null when the visitor is flexible. */
  month: string | null;
  adults: number;
  children: number;
};

export type VisaDraft = {
  country: VisaCountryOption | null;
  type: VisaTypeKey;
  applicants: number;
};

export type PickerKey =
  | "from"
  | "to"
  | "dates"
  | "travellers"
  | "place"
  | "stay"
  | "rooms"
  | "destination"
  | "month"
  | "party"
  | "country"
  | "visaType"
  | "applicants";

export type DateFocus = "start" | "end";

export type OpenPicker = { key: PickerKey; leg: number; focus: DateFocus };

export type ErrorCode =
  | "fromRequired"
  | "toRequired"
  | "sameAirport"
  | "departRequired"
  | "departPast"
  | "returnRequired"
  | "returnBeforeDepart"
  | "legOrder"
  | "tooManyTravellers"
  | "infantsOverAdults"
  | "childAgeRequired"
  | "placeRequired"
  | "checkinRequired"
  | "checkoutRequired"
  | "stayTooLong"
  | "countryRequired";

/** Field ids double as DOM ids and error keys: "from", "legs.1.to", "stay"… */
export type FieldErrors = Record<string, ErrorCode>;

export type SearchState = {
  tab: SearchTab;
  flight: FlightDraft;
  hotel: HotelDraft;
  tour: TourDraft;
  visa: VisaDraft;
  picker: OpenPicker | null;
  /** Counts swaps, so the swap icon turns another half circle each time. */
  swaps: number;
  errors: FieldErrors;
};

/** What the visitor entered, without the transient UI (open picker, errors, swap count). */
export type SearchDraft = Pick<SearchState, "tab" | "flight" | "hotel" | "tour" | "visa">;

export type CountField =
  | "adults"
  | "children"
  | "infants"
  | "rooms"
  | "hotelAdults"
  | "hotelChildren"
  | "tourAdults"
  | "tourChildren"
  | "applicants";

export type SearchAction =
  | { type: "tab"; tab: SearchTab }
  | { type: "trip"; trip: TripType }
  | { type: "open"; key: PickerKey; leg?: number; focus?: DateFocus }
  | { type: "close" }
  | { type: "pickAirport"; airport: Airport }
  | { type: "swap" }
  | { type: "pickDate"; iso: string }
  | { type: "focusDate"; focus: DateFocus }
  | { type: "addReturn" }
  | { type: "addLeg" }
  | { type: "removeLeg"; index: number }
  | { type: "count"; field: CountField; delta: 1 | -1 }
  | { type: "childAge"; scope: "flight" | "hotel"; index: number; age: number | null }
  | { type: "cabin"; cabin: CabinClass }
  | { type: "toggle"; option: "direct" | "flex" | "student" }
  | { type: "airline"; code: string | null }
  | { type: "nationality"; code: string }
  | { type: "pickPlace"; place: HotelPlace }
  | { type: "pickDestination"; destination: DestinationOption | null; search?: string }
  | { type: "pickMonth"; month: string | null }
  | { type: "pickCountry"; country: VisaCountryOption }
  | { type: "pickVisaType"; visaType: VisaTypeKey }
  | { type: "popularFlight"; airport: Airport }
  | { type: "errors"; errors: FieldErrors }
  | { type: "restore"; draft: SearchDraft };

export const MAX_ROOM_ADULTS = 6;
export const MAX_ROOM_CHILDREN = 4;
export const MAX_HOTEL_CHILDREN = 8;

export function initialSearchState(options: {
  origin: Airport | null;
  tab?: SearchTab;
}): SearchState {
  return {
    tab: options.tab ?? "flight",
    flight: {
      trip: "one-way",
      from: options.origin,
      to: null,
      depart: null,
      return: null,
      legs: [],
      adults: 1,
      childAges: [],
      infants: 0,
      cabin: "economy",
      direct: false,
      flex: false,
      fare: "regular",
      airline: null,
    },
    hotel: {
      place: null,
      checkin: null,
      checkout: null,
      rooms: 1,
      adults: 2,
      childAges: [],
      nationality: "BD",
    },
    tour: { destination: null, search: "", month: null, adults: 2, children: 0 },
    visa: { country: null, type: "tourist", applicants: 1 },
    picker: null,
    swaps: 0,
    errors: {},
  };
}

const open = (key: PickerKey, leg = 0, focus: DateFocus = "start"): OpenPicker => ({
  key,
  leg,
  focus,
});

function withoutErrors(errors: FieldErrors, ...fields: string[]): FieldErrors {
  if (!fields.some((field) => field in errors)) return errors;
  const next = { ...errors };
  for (const field of fields) delete next[field];
  return next;
}

function withoutLegErrors(errors: FieldErrors): FieldErrors {
  return withoutErrors(errors, ...Object.keys(errors).filter((key) => key.startsWith("legs.")));
}

export function travellerTotal(flight: Pick<FlightDraft, "adults" | "childAges" | "infants">) {
  return flight.adults + flight.childAges.length + flight.infants;
}

/** Upper and lower bounds for every stepper, so the UI can disable − and + exactly when a tap would fail. */
export function countLimits(
  state: SearchState,
  field: CountField,
): { value: number; min: number; max: number } {
  const { flight, hotel, tour, visa } = state;
  const children = flight.childAges.length;
  switch (field) {
    case "adults":
      return { value: flight.adults, min: 1, max: MAX_TRAVELLERS - children - flight.infants };
    case "children":
      return { value: children, min: 0, max: MAX_TRAVELLERS - flight.adults - flight.infants };
    case "infants":
      return {
        value: flight.infants,
        min: 0,
        max: Math.min(flight.adults, MAX_TRAVELLERS - flight.adults - children),
      };
    case "rooms":
      return { value: hotel.rooms, min: 1, max: MAX_HOTEL_ROOMS };
    case "hotelAdults":
      return { value: hotel.adults, min: hotel.rooms, max: hotel.rooms * MAX_ROOM_ADULTS };
    case "hotelChildren":
      return {
        value: hotel.childAges.length,
        min: 0,
        max: Math.min(MAX_HOTEL_CHILDREN, hotel.rooms * MAX_ROOM_CHILDREN),
      };
    case "tourAdults":
      return { value: tour.adults, min: 1, max: MAX_TOUR_ADULTS };
    case "tourChildren":
      return { value: tour.children, min: 0, max: MAX_TOUR_CHILDREN };
    case "applicants":
      return { value: visa.applicants, min: 1, max: MAX_VISA_APPLICANTS };
  }
}

function resize(ages: Array<number | null>, length: number): Array<number | null> {
  return length <= ages.length
    ? ages.slice(0, length)
    : [...ages, ...Array.from({ length: length - ages.length }, () => null)];
}

function applyCount(state: SearchState, field: CountField, delta: 1 | -1): SearchState {
  const { value, min, max } = countLimits(state, field);
  const next = Math.min(max, Math.max(min, value + delta));
  if (next === value) return state;
  const { flight, hotel, tour, visa } = state;
  switch (field) {
    case "adults":
      return {
        ...state,
        flight: { ...flight, adults: next, infants: Math.min(flight.infants, next) },
        errors: withoutErrors(state.errors, "travellers"),
      };
    case "children":
      return {
        ...state,
        flight: { ...flight, childAges: resize(flight.childAges, next) },
        errors: withoutErrors(state.errors, "travellers"),
      };
    case "infants":
      return {
        ...state,
        flight: { ...flight, infants: next },
        errors: withoutErrors(state.errors, "travellers"),
      };
    case "rooms": {
      const childCap = Math.min(MAX_HOTEL_CHILDREN, next * MAX_ROOM_CHILDREN);
      return {
        ...state,
        hotel: {
          ...hotel,
          rooms: next,
          adults: Math.min(next * MAX_ROOM_ADULTS, Math.max(hotel.adults, next)),
          childAges: hotel.childAges.slice(0, childCap),
        },
        errors: withoutErrors(state.errors, "rooms"),
      };
    }
    case "hotelAdults":
      return { ...state, hotel: { ...hotel, adults: next } };
    case "hotelChildren":
      return {
        ...state,
        hotel: { ...hotel, childAges: resize(hotel.childAges, next) },
        errors: withoutErrors(state.errors, "rooms"),
      };
    case "tourAdults":
      return { ...state, tour: { ...tour, adults: next } };
    case "tourChildren":
      return { ...state, tour: { ...tour, children: next } };
    case "applicants":
      return { ...state, visa: { ...visa, applicants: next } };
  }
}

function toMultiCity(flight: FlightDraft): FlightLegDraft[] {
  if (flight.legs.length >= 2) return flight.legs;
  const first: FlightLegDraft = { from: flight.from, to: flight.to, date: flight.depart };
  const second: FlightLegDraft = {
    from: flight.to,
    to: flight.trip === "round-trip" ? flight.from : null,
    date: flight.trip === "round-trip" ? flight.return : null,
  };
  return [first, second];
}

function setTrip(state: SearchState, trip: TripType): SearchState {
  const flight = state.flight;
  if (flight.trip === trip) return state;
  if (trip === "multi-city") {
    return {
      ...state,
      flight: { ...flight, trip, legs: toMultiCity(flight) },
      picker: null,
      errors: {},
    };
  }
  const first = flight.trip === "multi-city" ? flight.legs[0] : undefined;
  return {
    ...state,
    flight: {
      ...flight,
      trip,
      ...(first ? { from: first.from, to: first.to, depart: first.date } : {}),
      return: trip === "one-way" ? null : flight.return,
    },
    picker: null,
    errors: {},
  };
}

function pickAirport(state: SearchState, airport: Airport): SearchState {
  const picker = state.picker;
  if (!picker || (picker.key !== "from" && picker.key !== "to")) return state;
  const flight = state.flight;
  const side = picker.key;

  if (flight.trip === "multi-city") {
    const legs = flight.legs.map((leg) => ({ ...leg }));
    const leg = legs[picker.leg];
    if (!leg) return state;
    leg[side] = airport;
    const following = legs[picker.leg + 1];
    if (side === "to" && following && !following.from) following.from = airport;
    return {
      ...state,
      flight: { ...flight, legs },
      picker: side === "from" ? open("to", picker.leg) : open("dates", picker.leg),
      errors: withoutLegErrors(state.errors),
    };
  }

  const other = side === "from" ? flight.to : flight.from;
  const swapping = other?.iata === airport.iata;
  const next =
    side === "from"
      ? { from: airport, to: swapping ? flight.from : flight.to }
      : { to: airport, from: swapping ? flight.to : flight.from };
  return {
    ...state,
    flight: { ...flight, ...next },
    picker: side === "from" && !next.to ? open("to") : side === "from" ? null : open("dates"),
    errors: withoutErrors(state.errors, "from", "to"),
  };
}

function pickFlightDate(state: SearchState, iso: string): SearchState {
  const { flight, picker } = state;
  if (!picker) return state;
  if (flight.trip === "multi-city") {
    const legs = flight.legs.map((leg, index) => {
      if (index === picker.leg) return { ...leg, date: iso };
      if (index > picker.leg && leg.date && daysBetween(iso, leg.date) < 0)
        return { ...leg, date: iso };
      return leg;
    });
    return { ...state, flight: { ...flight, legs }, errors: withoutLegErrors(state.errors) };
  }
  if (flight.trip === "one-way") {
    return {
      ...state,
      flight: { ...flight, depart: iso },
      errors: withoutErrors(state.errors, "depart"),
    };
  }
  if (picker.focus === "end" && flight.depart && daysBetween(flight.depart, iso) >= 0) {
    return {
      ...state,
      flight: { ...flight, return: iso },
      errors: withoutErrors(state.errors, "return"),
    };
  }
  const keepReturn = flight.return && daysBetween(iso, flight.return) >= 0 ? flight.return : null;
  return {
    ...state,
    flight: { ...flight, depart: iso, return: keepReturn },
    picker: { ...picker, focus: "end" },
    errors: withoutErrors(state.errors, "depart", "return"),
  };
}

function pickStayDate(state: SearchState, iso: string): SearchState {
  const { hotel, picker } = state;
  if (!picker) return state;
  if (picker.focus === "end" && hotel.checkin) {
    const nights = daysBetween(hotel.checkin, iso);
    if (nights >= 1 && nights <= MAX_HOTEL_NIGHTS) {
      return {
        ...state,
        hotel: { ...hotel, checkout: iso },
        errors: withoutErrors(state.errors, "stay"),
      };
    }
    // Past the 30-night limit: the calendar disables these days, so a stray pick keeps the check-in.
    if (nights > MAX_HOTEL_NIGHTS) return state;
  }
  const keep =
    hotel.checkout &&
    daysBetween(iso, hotel.checkout) >= 1 &&
    daysBetween(iso, hotel.checkout) <= MAX_HOTEL_NIGHTS
      ? hotel.checkout
      : null;
  return {
    ...state,
    hotel: { ...hotel, checkin: iso, checkout: keep },
    picker: { ...picker, focus: "end" },
    errors: withoutErrors(state.errors, "stay"),
  };
}

export function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "tab":
      return state.tab === action.tab
        ? state
        : { ...state, tab: action.tab, picker: null, errors: {} };
    case "trip":
      return setTrip(state, action.trip);
    case "open":
      return { ...state, picker: open(action.key, action.leg ?? 0, action.focus ?? "start") };
    case "close":
      return state.picker ? { ...state, picker: null } : state;
    case "pickAirport":
      return pickAirport(state, action.airport);
    case "swap":
      return {
        ...state,
        flight: { ...state.flight, from: state.flight.to, to: state.flight.from },
        swaps: state.swaps + 1,
        errors: withoutErrors(state.errors, "from", "to"),
      };
    case "pickDate":
      return state.picker?.key === "stay"
        ? pickStayDate(state, action.iso)
        : pickFlightDate(state, action.iso);
    case "focusDate":
      return state.picker ? { ...state, picker: { ...state.picker, focus: action.focus } } : state;
    case "addReturn":
      return {
        ...state,
        flight: { ...state.flight, trip: "round-trip", return: null },
        picker: open("dates", 0, state.flight.depart ? "end" : "start"),
      };
    case "addLeg": {
      const legs = state.flight.legs;
      if (legs.length >= MAX_MULTI_CITY_LEGS) return state;
      const last = legs[legs.length - 1];
      const leg: FlightLegDraft = {
        from: last?.to ?? null,
        to: null,
        date: last?.date ? addDays(last.date, 3) : null,
      };
      return { ...state, flight: { ...state.flight, legs: [...legs, leg] } };
    }
    case "removeLeg": {
      const legs = state.flight.legs;
      if (legs.length <= 2) return state;
      return {
        ...state,
        flight: { ...state.flight, legs: legs.filter((_, index) => index !== action.index) },
        picker: null,
        errors: withoutLegErrors(state.errors),
      };
    }
    case "count":
      return applyCount(state, action.field, action.delta);
    case "childAge": {
      const target = action.scope === "flight" ? state.flight : state.hotel;
      if (action.index < 0 || action.index >= target.childAges.length) return state;
      const childAges = target.childAges.map((age, index) =>
        index === action.index ? action.age : age,
      );
      return action.scope === "flight"
        ? {
            ...state,
            flight: { ...state.flight, childAges },
            errors: withoutErrors(state.errors, "travellers"),
          }
        : {
            ...state,
            hotel: { ...state.hotel, childAges },
            errors: withoutErrors(state.errors, "rooms"),
          };
    }
    case "cabin":
      return { ...state, flight: { ...state.flight, cabin: action.cabin } };
    case "toggle": {
      const flight = state.flight;
      if (action.option === "student") {
        return {
          ...state,
          flight: { ...flight, fare: flight.fare === "student" ? "regular" : "student" },
        };
      }
      return { ...state, flight: { ...flight, [action.option]: !flight[action.option] } };
    }
    case "airline":
      return { ...state, flight: { ...state.flight, airline: action.code } };
    case "nationality":
      return { ...state, hotel: { ...state.hotel, nationality: action.code } };
    case "pickPlace":
      return {
        ...state,
        hotel: { ...state.hotel, place: action.place },
        picker: state.hotel.checkin ? null : open("stay"),
        errors: withoutErrors(state.errors, "place"),
      };
    case "pickDestination":
      return {
        ...state,
        tour: { ...state.tour, destination: action.destination, search: action.search ?? "" },
        picker: open("month"),
      };
    case "pickMonth":
      return { ...state, tour: { ...state.tour, month: action.month }, picker: open("party") };
    case "pickCountry": {
      const type = action.country.types.includes(state.visa.type)
        ? state.visa.type
        : (action.country.types[0] ?? "tourist");
      return {
        ...state,
        visa: { ...state.visa, country: action.country, type },
        picker: open("visaType"),
        errors: withoutErrors(state.errors, "country"),
      };
    }
    case "pickVisaType":
      return {
        ...state,
        visa: { ...state.visa, type: action.visaType },
        picker: open("applicants"),
      };
    case "popularFlight": {
      // A popular chip fills To; on a multi-city search it goes back to a simple trip first.
      const base = state.flight.trip === "multi-city" ? setTrip(state, "one-way") : state;
      const flight = base.flight;
      if (flight.from?.iata === action.airport.iata) return base;
      return {
        ...base,
        flight: { ...flight, to: action.airport },
        picker: flight.depart ? null : open("dates"),
        errors: withoutErrors(base.errors, "to"),
      };
    }
    case "errors":
      return { ...state, errors: action.errors };
    case "restore":
      return { ...state, ...action.draft, picker: null, errors: {} };
  }
}

/* ---------- validation, mapped to the field that shows the message ---------- */

export function validateFlight(flight: FlightDraft, today: string): FieldErrors {
  const errors: FieldErrors = {};
  if (flight.trip === "multi-city") {
    flight.legs.forEach((leg, index) => {
      if (!leg.from) errors[`legs.${index}.from`] = "fromRequired";
      if (!leg.to) errors[`legs.${index}.to`] = "toRequired";
      else if (leg.from && leg.from.iata === leg.to.iata)
        errors[`legs.${index}.to`] = "sameAirport";
      if (!leg.date) errors[`legs.${index}.date`] = "departRequired";
      else if (daysBetween(today, leg.date) < 0) errors[`legs.${index}.date`] = "departPast";
      const previous = flight.legs[index - 1];
      if (leg.date && previous?.date && daysBetween(previous.date, leg.date) < 0) {
        errors[`legs.${index}.date`] = "legOrder";
      }
    });
  } else {
    if (!flight.from) errors.from = "fromRequired";
    if (!flight.to) errors.to = "toRequired";
    else if (flight.from && flight.from.iata === flight.to.iata) errors.to = "sameAirport";
    if (!flight.depart) errors.depart = "departRequired";
    else if (daysBetween(today, flight.depart) < 0) errors.depart = "departPast";
    if (flight.trip === "round-trip") {
      if (!flight.return) errors.return = "returnRequired";
      else if (flight.depart && daysBetween(flight.depart, flight.return) < 0) {
        errors.return = "returnBeforeDepart";
      }
    }
  }
  if (travellerTotal(flight) > MAX_TRAVELLERS) errors.travellers = "tooManyTravellers";
  else if (flight.infants > flight.adults) errors.travellers = "infantsOverAdults";
  else if (flight.childAges.some((age) => age === null)) errors.travellers = "childAgeRequired";
  return errors;
}

export function validateHotel(hotel: HotelDraft, today: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!hotel.place) errors.place = "placeRequired";
  if (!hotel.checkin) errors.stay = "checkinRequired";
  else if (daysBetween(today, hotel.checkin) < 0) errors.stay = "departPast";
  else if (!hotel.checkout) errors.stay = "checkoutRequired";
  else if (daysBetween(hotel.checkin, hotel.checkout) > MAX_HOTEL_NIGHTS)
    errors.stay = "stayTooLong";
  if (hotel.childAges.some((age) => age === null)) errors.rooms = "childAgeRequired";
  return errors;
}

export function validateVisa(visa: VisaDraft): FieldErrors {
  return visa.country ? {} : { country: "countryRequired" };
}

/** The field to open when a submit fails: the first error in the card's reading order. */
export function firstErrorField(errors: FieldErrors): string | null {
  const order = [
    "from",
    "to",
    "depart",
    "return",
    "place",
    "stay",
    "country",
    "travellers",
    "rooms",
  ];
  const legKeys = Object.keys(errors)
    .filter((key) => key.startsWith("legs."))
    .sort((a, b) => {
      const [, ai = "0", af = ""] = a.split(".");
      const [, bi = "0", bf = ""] = b.split(".");
      const fields = ["from", "to", "date"];
      return Number(ai) - Number(bi) || fields.indexOf(af) - fields.indexOf(bf);
    });
  return legKeys[0] ?? order.find((key) => key in errors) ?? null;
}
