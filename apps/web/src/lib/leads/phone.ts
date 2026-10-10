import {
  getCountryCallingCode,
  isSupportedCountry,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/min";

/** True when libphonenumber knows the two-letter country code (admin data is validated against this). */
export function isPhoneCountry(code: string): code is CountryCode {
  return isSupportedCountry(code);
}

/**
 * Turns what the visitor typed into E.164 for the chosen country (default Bangladesh, FR-FLT-02). Accepts local
 * forms like "01712-345678" or "1712 345678" and full "+8801712345678"; returns null when it is not a valid number
 * for that country.
 */
export function toE164(input: string, country: CountryCode = "BD"): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parsed = parsePhoneNumberFromString(trimmed, country);
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number;
}

/** "+880" for "BD". */
export function dialCode(country: CountryCode): string {
  return `+${getCountryCallingCode(country)}`;
}
