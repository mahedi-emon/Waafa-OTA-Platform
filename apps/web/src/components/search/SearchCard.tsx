import { NextIntlClientProvider } from "next-intl";
import type { FlightSearch, HotelSearch } from "@waafa/shared";
import { loadSearchCard } from "./loadSearchCard";
import { SearchCardClient } from "./SearchCardClient";

type SearchCardProps = {
  /** Where the card sits, for the search log ("home", "flights"…). */
  source: string;
  className?: string;
  /** A flight search from the URL (results pages): the card opens with it filled in. */
  initialFlight?: FlightSearch | null;
  /** A hotel search from the URL (hotel results): the card opens on the hotel tab with it filled in. */
  initialHotel?: HotelSearch | null;
};

/**
 * The unified search card (FR-SRCH-01 to FR-SRCH-10): resolves its admin-managed data on the server and hands
 * it, with only the Search strings, to the interactive client island.
 */
export async function SearchCard({
  source,
  className,
  initialFlight,
  initialHotel,
}: SearchCardProps) {
  const card = await loadSearchCard({ initialFlight, initialHotel });

  return (
    <NextIntlClientProvider messages={card.messages}>
      <SearchCardClient
        data={card.data}
        source={source}
        className={className}
        initialFlight={card.initialFlight}
        initialHotel={card.initialHotel}
      />
    </NextIntlClientProvider>
  );
}
