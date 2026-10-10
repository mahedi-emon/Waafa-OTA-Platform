import type { FlightLeg } from "@waafa/shared";
import { createParser } from "nuqs/server";
import { isIsoDate, isIsoMonth } from "./isoDate";

/* URL parsers shared by the search card (writes) and the results and listing pages (reads). */

const IATA = /^[A-Z]{3}$/;
const LEG = /^([A-Za-z]{3})-([A-Za-z]{3})-(\d{4}-\d{2}-\d{2})$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const parseAsIata = createParser({
  parse(value: string) {
    const code = value.trim().toUpperCase();
    return IATA.test(code) ? code : null;
  },
  serialize: (code: string) => code,
});

export const parseAsIsoDateString = createParser({
  parse: (value: string) => (isIsoDate(value) ? value : null),
  serialize: (date: string) => date,
});

export const parseAsTravelMonth = createParser({
  parse: (value: string) => (isIsoMonth(value) ? value : null),
  serialize: (month: string) => month,
});

export const parseAsAirlineCode = createParser({
  parse(value: string) {
    const code = value.trim().toUpperCase();
    return /^[A-Z0-9]{2}$/.test(code) ? code : null;
  },
  serialize: (code: string) => code,
});

export const parseAsCountryCode = createParser({
  parse(value: string) {
    const code = value.trim().toUpperCase();
    return /^[A-Z]{2}$/.test(code) ? code : null;
  },
  serialize: (code: string) => code,
});

export const parseAsSlug = createParser({
  parse: (value: string) => (SLUG.test(value) ? value : null),
  serialize: (slug: string) => slug,
});

/** One multi-city flight as "DAC-DXB-2026-10-22". */
export const parseAsLeg = createParser<FlightLeg>({
  parse(value: string) {
    const match = LEG.exec(value.trim());
    if (!match) return null;
    const [, from = "", to = "", date = ""] = match;
    if (!isIsoDate(date)) return null;
    return { from: from.toUpperCase(), to: to.toUpperCase(), date };
  },
  serialize: (leg) => `${leg.from}-${leg.to}-${leg.date}`,
  eq: (a, b) => a.from === b.from && a.to === b.to && a.date === b.date,
});
