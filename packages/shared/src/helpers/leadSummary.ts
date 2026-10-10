import { formatDayMonth } from "../format/date";
import { formatTaka } from "../format/money";
import type { LeadPayload } from "../schemas/leads";

export type LeadDigest = {
  /** One line for admin tables and alerts, e.g. "DAC → DXB · 14 Nov · 3 travellers". */
  summary: string;
  /** The date the trip starts or the visa is needed, as YYYY-MM-DD, when known. */
  travelDate?: string;
  travellers?: number;
};

const people = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
const clip = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

/** Summarises a lead's payload for the admin list, staff alerts and the customer email (FR-ADM-LEAD). */
export function summarizeLead(payload: LeadPayload): LeadDigest {
  switch (payload.module) {
    case "flights": {
      const { search } = payload;
      const first = search.legs[0];
      const route =
        search.tripType === "multi-city"
          ? [first?.from, ...search.legs.map((leg) => leg.to)].join(" → ")
          : `${first?.from} ${search.tripType === "round-trip" ? "⇄" : "→"} ${first?.to}`;
      const count =
        search.travellers.adults + search.travellers.childAges.length + search.travellers.infants;
      return {
        summary: `${route} · ${first ? formatDayMonth(first.date) : ""} · ${people(count, "traveller", "travellers")}`,
        ...(first ? { travelDate: first.date } : {}),
        travellers: count,
      };
    }
    case "hotels": {
      const { search } = payload;
      const guests = search.rooms.reduce(
        (sum, room) => sum + room.adults + room.childAges.length,
        0,
      );
      return {
        summary: `${search.placeLabel} · ${formatDayMonth(search.checkIn)} to ${formatDayMonth(search.checkOut)} · ${people(search.rooms.length, "room", "rooms")}, ${people(guests, "guest", "guests")}`,
        travelDate: search.checkIn,
        travellers: guests,
      };
    }
    case "packages": {
      const count =
        payload.travellers.adults + payload.travellers.children + payload.travellers.infants;
      const when = payload.departure === "any" ? "any date" : formatDayMonth(payload.departure);
      return {
        summary: `${payload.packageTitle} · ${when} · ${people(count, "traveller", "travellers")}`,
        ...(payload.departure !== "any" ? { travelDate: payload.departure } : {}),
        travellers: count,
      };
    }
    case "plan-trip": {
      const count =
        payload.travellers.adults + payload.travellers.children + payload.travellers.infants;
      const when = payload.startDate ? formatDayMonth(payload.startDate) : (payload.month ?? "");
      return {
        summary: `${payload.destinations.join(", ")} · ${when} · ${payload.nights} nights · ${people(count, "traveller", "travellers")}`,
        ...(payload.startDate ? { travelDate: payload.startDate } : {}),
        travellers: count,
      };
    }
    case "visa":
      return {
        summary: `${payload.countryName} ${payload.visaType} visa · ${people(payload.applicants, "applicant", "applicants")} · travel ${formatDayMonth(payload.travelDate)}`,
        travelDate: payload.travelDate,
        travellers: payload.applicants,
      };
    case "printing":
      return { summary: `${payload.company} · ${payload.service} · ${payload.frequency}` };
    case "trading":
      return {
        summary: `${payload.direction}: ${payload.product} · ${payload.quantity} ${payload.unit} · ${payload.country}`,
      };
    case "contact":
      return { summary: `${payload.topic}: ${clip(payload.message.replace(/\s+/g, " "), 90)}` };
    case "emi":
      return {
        summary: `EMI ${formatTaka(payload.amount)} · ${payload.tenureMonths} months · ${payload.bank}`,
      };
    case "bulk":
      return {
        summary: `${payload.company} · ${clip(payload.items.split("\n")[0] ?? "", 90)}`,
      };
  }
}

/** The digest, with the summary clipped to the 140 characters the lead table keeps. */
export function leadDigest(payload: LeadPayload): LeadDigest {
  const digest = summarizeLead(payload);
  return { ...digest, summary: clip(digest.summary, 140) };
}
