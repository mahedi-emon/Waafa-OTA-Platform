import { flattenForDisplay } from "./flatten";
import { formatPlainDate, humanize, taka } from "./format";

/** One labelled fact of a customer's request ("Flight 1 · DAC → DXB, 14 Nov 2026"). */
export type LeadFact = { label: string; value: string; wide?: boolean };

/** The words facts need, from Admin.lead (passed in so this stays a plain function). */
export type LeadWords = {
  /** Admin.lead.facts.<key> */
  label: (key: string) => string;
  /** Admin.lead.values.<group>.<value>, or undefined to fall back to the value in sentence case. */
  value: (group: string, value: string) => string | undefined;
  travellers: (adults: number, children: number, infants: number) => string;
  flight: (n: number) => string;
  /** "Dubai (DXB)" for an airport code, when the airport list knows it. */
  airport: (iata: string) => string;
  anyDate: string;
  files: (count: number) => string;
  yes: string;
  no: string;
};

type Payload = Record<string, unknown>;

const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;
const num = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;
const date = (value: unknown) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)
    ? formatPlainDate(value)
    : undefined;
const month = (value: unknown) => {
  const match = typeof value === "string" ? /^(\d{4})-(\d{2})$/.exec(value) : null;
  if (!match) return undefined;
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)));
};

/** Turns a customer's request into labelled facts, module by module; anything unexpected still shows, labelled. */
export function leadFacts(payload: unknown, words: LeadWords): LeadFact[] {
  const data = (payload && typeof payload === "object" ? payload : {}) as Payload;
  const facts: LeadFact[] = [];
  const used = new Set<string>(["module"]);
  const push = (key: string, value: string | undefined, wide = false) => {
    used.add(key);
    if (value !== undefined && value !== "")
      facts.push({ label: words.label(key), value, ...(wide ? { wide } : {}) });
  };
  const choice = (group: string, value: unknown) => {
    const raw = text(value) ?? (typeof value === "number" ? String(value) : undefined);
    return raw === undefined ? undefined : (words.value(group, raw) ?? humanize(raw));
  };
  const yes = (value: unknown) => (value === true ? words.yes : undefined);
  const list = (value: unknown, group?: string) =>
    Array.isArray(value) && value.length > 0
      ? value
          .map((item) => (group ? (choice(group, item) ?? String(item)) : String(item)))
          .join(", ")
      : undefined;
  const people = (value: unknown) => {
    const counts = (value && typeof value === "object" ? value : {}) as Payload;
    const children = Array.isArray(counts.childAges)
      ? counts.childAges.length
      : (num(counts.children) ?? 0);
    const adults = num(counts.adults);
    return adults === undefined
      ? undefined
      : words.travellers(adults, children, num(counts.infants) ?? 0);
  };
  const files = (value: unknown) =>
    Array.isArray(value) && value.length > 0
      ? `${words.files(value.length)}: ${value
          .map((file) => text((file as Payload | null)?.fileName) ?? "")
          .filter(Boolean)
          .join(", ")}`
      : undefined;

  switch (data.module) {
    case "flights": {
      const search = (data.search && typeof data.search === "object" ? data.search : {}) as Payload;
      used.add("search");
      push("trip", choice("tripType", search.tripType));
      const legs = Array.isArray(search.legs) ? (search.legs as Payload[]) : [];
      legs.forEach((leg, index) => {
        const from = text(leg.from);
        const to = text(leg.to);
        const route = `${from ? words.airport(from) : "?"} → ${to ? words.airport(to) : "?"}`;
        const value = [route, date(leg.date)].filter(Boolean).join(", ");
        facts.push({ label: words.flight(index + 1), value });
      });
      push("returnDate", date(search.returnDate));
      push("travellers", people(search.travellers));
      push("cabin", choice("cabin", search.cabin));
      push("airline", text(search.preferredAirline));
      push("directOnly", yes(search.directOnly));
      push("flexibleDates", yes(search.flexibleDates));
      push(
        "fareType",
        search.fareType === "student" ? choice("fareType", search.fareType) : undefined,
      );
      push("groupFare", data.groupFareId ? words.yes : undefined);
      used.add("groupFareId");
      const preferences = (
        data.preferences && typeof data.preferences === "object" ? data.preferences : {}
      ) as Payload;
      used.add("preferences");
      push(
        "stops",
        preferences.stops && preferences.stops !== "any"
          ? choice("stops", preferences.stops)
          : undefined,
      );
      push("times", list(preferences.times, "times"));
      push("airlines", list(preferences.airlines));
      push(
        "bag",
        preferences.bag && preferences.bag !== "any" ? choice("bag", preferences.bag) : undefined,
      );
      push("refundableOnly", yes(preferences.refundableOnly));
      break;
    }
    case "hotels": {
      const search = (data.search && typeof data.search === "object" ? data.search : {}) as Payload;
      used.add("search");
      push("place", text(search.placeLabel));
      // A curated hotel's Request booking (issue 249).
      push("hotel", text(data.hotelName));
      push("roomType", text(data.roomType));
      used.add("hotelId").add("hotelName");
      push("checkIn", date(search.checkIn));
      push("checkOut", date(search.checkOut));
      const rooms = Array.isArray(search.rooms) ? (search.rooms as Payload[]) : [];
      rooms.forEach((room, index) =>
        facts.push({ label: `${words.label("rooms")} ${index + 1}`, value: people(room) ?? "" }),
      );
      push("nationality", text(search.nationality));
      push(
        "stars",
        data.starPreference !== "any" ? choice("stars", data.starPreference) : undefined,
      );
      used.add("starPreference");
      push(
        "budgetPerNight",
        num(data.budgetPerNight) === undefined ? undefined : taka(num(data.budgetPerNight)),
      );
      push(
        "budgetBand",
        data.budgetBand !== "any" ? choice("hotelBudget", data.budgetBand) : undefined,
      );
      push("meals", data.meals !== "any" ? choice("meals", data.meals) : undefined);
      push("seaView", yes(data.seaView));
      push("freeCancellation", yes(data.freeCancellation));
      break;
    }
    case "packages":
      push("package", text(data.packageTitle));
      used.add("packageTitle");
      used.add("packageId");
      push("departure", data.departure === "any" ? words.anyDate : date(data.departure));
      push("travellers", people(data.travellers));
      push("roomSharing", choice("roomSharing", data.roomSharing));
      break;
    case "plan-trip":
      push("destinations", list(data.destinations));
      push("startDate", date(data.startDate));
      push("month", month(data.month));
      push("nights", num(data.nights) === undefined ? undefined : String(num(data.nights)));
      push("travellers", people(data.travellers));
      push(
        "budgetPerPerson",
        num(data.budgetPerPerson) === undefined ? undefined : taka(num(data.budgetPerPerson)),
      );
      push(
        "budgetBand",
        data.budgetBand !== "any" ? choice("tripBudget", data.budgetBand) : undefined,
      );
      push(
        "hotelClass",
        data.hotelClass !== "any" ? choice("hotelClass", data.hotelClass) : undefined,
      );
      push("tripFor", choice("tripFor", data.tripFor));
      push("interests", list(data.interests));
      push("includeFlights", data.includeFlights === false ? words.no : words.yes);
      push("visaHelp", yes(data.visaHelp));
      break;
    case "visa":
      push("country", text(data.countryName));
      used.add("countryName");
      used.add("countrySlug");
      push("visaType", choice("visaType", data.visaType));
      push(
        "applicants",
        num(data.applicants) === undefined ? undefined : String(num(data.applicants)),
      );
      push("travelDate", date(data.travelDate));
      push(
        "appointment",
        [date(data.appointmentDate), choice("appointmentWindow", data.appointmentWindow)]
          .filter(Boolean)
          .join(", ") || undefined,
      );
      used.add("appointmentDate").add("appointmentWindow");
      push("documents", files(data.documents), true);
      break;
    case "printing":
      push("company", text(data.company));
      push("service", choice("printingService", data.service));
      push("volume", text(data.volume));
      push("frequency", choice("frequency", data.frequency));
      push("location", text(data.location));
      push("attachments", files(data.attachments), true);
      break;
    case "trading":
      push("company", text(data.company));
      push("direction", choice("direction", data.direction));
      push("country", text(data.country));
      push("product", text(data.product));
      push(
        "quantity",
        num(data.quantity) === undefined
          ? undefined
          : `${num(data.quantity)} ${text(data.unit) ?? ""}`.trim(),
      );
      used.add("unit");
      push("targetPrice", text(data.targetPrice));
      push("deliveryTerms", choice("deliveryTerms", data.deliveryTerms));
      push("timeline", text(data.timeline));
      push("specifications", text(data.specifications), true);
      push("attachments", files(data.attachments), true);
      break;
    case "contact":
      push("topic", choice("topic", data.topic));
      push("message", text(data.message), true);
      break;
    case "emi":
      push("bank", text(data.bank));
      push("amount", num(data.amount) === undefined ? undefined : taka(num(data.amount)));
      push(
        "tenure",
        num(data.tenureMonths) === undefined ? undefined : String(num(data.tenureMonths)),
      );
      used.add("tenureMonths");
      break;
    case "bulk":
      push("company", text(data.company));
      push("items", text(data.items), true);
      break;
  }
  push("notes", text(data.notes), true);

  // Anything the request carries that isn't listed above still shows, labelled in plain words.
  const rest = Object.fromEntries(Object.entries(data).filter(([key]) => !used.has(key)));
  for (const row of flattenForDisplay(rest, { yes: words.yes, no: words.no })) facts.push(row);
  return facts;
}
