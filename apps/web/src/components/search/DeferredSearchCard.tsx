import { NextIntlClientProvider } from "next-intl";
import type { FlightSearch, HotelSearch } from "@waafa/shared";
import { DeferredSearchCardClient } from "./DeferredSearchCardClient";
import { loadSearchCard } from "./loadSearchCard";

type DeferredSearchCardProps = {
  /** Where the card sits, for the search log ("flights", "hotels"). */
  source: string;
  /** The flight search from the URL: the card opens with it filled in. */
  initialFlight?: FlightSearch | null;
  /** The hotel search from the URL: the card opens on the hotel tab with it filled in. */
  initialHotel?: HotelSearch | null;
};

/**
 * The search card for the results pages, where it waits behind Edit (issue 170). Same data as `SearchCard`, but this
 * file never imports the card's client island, so the island's JavaScript is not part of the page's first load; it
 * is fetched when the visitor opens Edit.
 */
export async function DeferredSearchCard({
  source,
  initialFlight,
  initialHotel,
}: DeferredSearchCardProps) {
  const card = await loadSearchCard({ initialFlight, initialHotel });

  return (
    <NextIntlClientProvider messages={card.messages}>
      <DeferredSearchCardClient
        data={card.data}
        source={source}
        initialFlight={card.initialFlight}
        initialHotel={card.initialHotel}
      />
    </NextIntlClientProvider>
  );
}
