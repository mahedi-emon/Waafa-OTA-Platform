import type { Airport, BookingMode, HotelPlace } from "@waafa/shared";
import type { DestinationOption, VisaCountryOption } from "@/lib/search/searchState";

/** Everything the search card needs from the data layer, resolved on the server (all admin-managed). */
export type SearchCardData = {
  /** The pinned airport list (FR-SRCH-06), Bangladesh first. */
  pinnedAirports: Airport[];
  /** "Popular" chips under the flight tab, in admin order. */
  popularFlights: Airport[];
  /** The airport the From field starts with. */
  defaultOrigin: Airport | null;
  /** Popular cities and hotels for the hotel tab before anything is typed. */
  hotelPlaces: HotelPlace[];
  destinations: DestinationOption[];
  visaCountries: VisaCountryOption[];
  airlines: Array<{ code: string; name: string }>;
  nationalities: Array<{ code: string; name: string }>;
  flightMode: BookingMode;
  phoneDisplay: string;
  whatsappE164: string;
};
