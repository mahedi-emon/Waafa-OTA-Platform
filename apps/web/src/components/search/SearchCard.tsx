import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { Airport } from "@waafa/shared";
import { listDestinations } from "@/lib/data/content";
import { getContactSettings, getPublicConfig, getSearchSettings } from "@/lib/data/settings";
import {
  listAirlines,
  listPinnedAirports,
  searchAirports,
  searchHotelPlaces,
} from "@/lib/data/travel";
import { listVisaCountries } from "@/lib/data/visa";
import { pickMessages } from "@/i18n/pickMessages";
import { SearchCardClient } from "./SearchCardClient";
import type { SearchCardData } from "./searchCardData";

type SearchCardProps = {
  /** Where the card sits, for the search log ("home", "flights"…). */
  source: string;
  className?: string;
};

async function airportByCode(code: string, pinned: Airport[]): Promise<Airport | null> {
  const known = pinned.find((airport) => airport.iata === code);
  if (known) return known;
  const [match] = await searchAirports(code, 1);
  return match?.iata === code ? match : null;
}

/**
 * The unified search card (FR-SRCH-01 to FR-SRCH-10): resolves its admin-managed data on the server and hands
 * it, with only the Search strings, to the interactive client island.
 */
export async function SearchCard({ source, className }: SearchCardProps) {
  const [
    settings,
    pinned,
    places,
    destinations,
    visaCountries,
    airlines,
    contact,
    config,
    messages,
  ] = await Promise.all([
    getSearchSettings(),
    listPinnedAirports(),
    searchHotelPlaces("", 12),
    listDestinations(),
    listVisaCountries(),
    listAirlines(),
    getContactSettings(),
    getPublicConfig(),
    getMessages(),
  ]);

  const popularFlights = (
    await Promise.all(settings.popularFlights.map((code) => airportByCode(code, pinned)))
  ).filter((airport): airport is Airport => airport !== null);
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

  const data: SearchCardData = {
    pinnedAirports: pinned,
    popularFlights,
    defaultOrigin: await airportByCode(settings.defaultOrigin, pinned),
    hotelPlaces: places,
    destinations: destinations.map((destination) => ({
      slug: destination.slug,
      name: destination.name,
      subtitle: destination.subtitle,
      domestic: destination.tags.includes("domestic"),
      countryCode: pinned.find((airport) => airport.iata === destination.iata)?.countryCode ?? null,
    })),
    visaCountries: visaCountries.map((country) => ({
      slug: country.slug,
      name: country.name,
      flagCode: country.flagCode,
      region: country.region,
      popular: country.popular,
      types: country.types.map((type) => type.type),
    })),
    airlines: airlines.map(({ code, name }) => ({ code, name })),
    nationalities: settings.hotelNationalities.map((code) => ({
      code,
      name: regionNames.of(code) ?? code,
    })),
    flightMode: config.modes.flights.mode,
    phoneDisplay: contact.phoneDisplay,
    whatsappE164: contact.whatsappE164,
  };

  return (
    <NextIntlClientProvider messages={pickMessages(messages, ["Search"])}>
      <SearchCardClient data={data} source={source} className={className} />
    </NextIntlClientProvider>
  );
}
