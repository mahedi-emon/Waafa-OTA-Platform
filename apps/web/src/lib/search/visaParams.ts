import { VisaTypeKeySchema, type VisaTypeKey } from "@waafa/shared";
import {
  createLoader,
  createSerializer,
  parseAsInteger,
  parseAsStringLiteral,
  type inferParserType,
} from "nuqs/server";
import { parseAsCountryCode } from "./parsers";
import { clamp } from "./tourParams";

/* The visa tab opens the country page with the visa type and party size (FR-SRCH-05). */

export const MAX_VISA_APPLICANTS = 10;
export const VISA_TYPES = VisaTypeKeySchema.options;

export const visaSearchParams = {
  type: parseAsStringLiteral(VISA_TYPES).withDefault("tourist"),
  applicants: parseAsInteger.withDefault(1),
  nationality: parseAsCountryCode.withDefault("BD"),
};

export type VisaSearchValues = inferParserType<typeof visaSearchParams>;

export const serializeVisaSearch = createSerializer(visaSearchParams);
export const loadVisaSearch = createLoader(visaSearchParams);

export function visaSearchHref(country: string, type: VisaTypeKey, applicants: number): string {
  return serializeVisaSearch(`/visa-services/${encodeURIComponent(country)}`, {
    type,
    applicants: clamp(applicants, 1, MAX_VISA_APPLICANTS),
    nationality: "BD",
  });
}
