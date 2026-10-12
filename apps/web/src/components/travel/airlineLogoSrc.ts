import type { Airline } from "@waafa/shared";
import { AIRLINE_LOGO_CODES } from "./airlineLogoCodes";

/** The logo to show for an airline: the Admin upload first, then the bundled mark for its code, else null. */
export function airlineLogoSrc(airline: Pick<Airline, "code" | "logo">): string | null {
  const uploaded = airline.logo?.src.trim();
  if (uploaded) return uploaded;
  const code = airline.code.trim().toUpperCase();
  return AIRLINE_LOGO_CODES.has(code) ? `/media/airlines/${code}.png` : null;
}
