"use client";

import { History } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { recentForModule, type RecentSearch, type SearchModule } from "@/lib/search/recentSearches";
import type { SearchTab } from "@/lib/search/searchState";
import { useSearchCard } from "./SearchCardContext";

const MODULE: Record<SearchTab, SearchModule> = {
  flight: "flights",
  hotel: "hotels",
  tour: "packages",
  visa: "visa",
};

const chipClass =
  "relative inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-mist-200 bg-white px-3 text-[13px] font-medium text-ink-900 transition-colors duration-150 outline-none before:absolute before:-inset-y-1.5 before:inset-x-0 before:content-[''] hover:border-electric-200 hover:bg-electric-50 focus-visible:ring-3 focus-visible:ring-ring/40";

type QuickPicksProps = { recent: RecentSearch[] };

/** "Popular:" chips (admin order) that fill the next field, and this browser's recent searches as links. */
function QuickPicks({ recent }: QuickPicksProps) {
  const t = useTranslations("Search");
  const { state, dispatch, data } = useSearchCard();
  const tab = state.tab;

  const popular: Array<{ key: string; label: string; onClick: () => void }> =
    tab === "flight"
      ? data.popularFlights
          .filter((airport) => airport.iata !== state.flight.from?.iata)
          .map((airport) => ({
            key: airport.iata,
            label: airport.city,
            onClick: () => dispatch({ type: "popularFlight", airport }),
          }))
      : tab === "hotel"
        ? data.hotelPlaces
            .filter((place) => place.popular)
            .slice(0, 4)
            .map((place) => ({
              key: place.id,
              label: place.name,
              onClick: () => dispatch({ type: "pickPlace", place }),
            }))
        : tab === "tour"
          ? data.destinations.slice(0, 4).map((destination) => ({
              key: destination.slug,
              label: destination.name,
              onClick: () => dispatch({ type: "pickDestination", destination }),
            }))
          : data.visaCountries
              .filter((country) => country.popular)
              .slice(0, 4)
              .map((country) => ({
                key: country.slug,
                label: country.name,
                onClick: () => dispatch({ type: "pickCountry", country }),
              }));
  const recentHere = recentForModule(recent, MODULE[tab]);

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
      {popular.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold text-mist-600">{t("popular")}</span>
          {popular.map((chip) => (
            <button key={chip.key} type="button" onClick={chip.onClick} className={chipClass}>
              {chip.label}
            </button>
          ))}
        </div>
      ) : null}
      {recentHere.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold text-mist-600">{t("recent")}</span>
          {recentHere.map((item) => (
            <Link key={item.href} href={item.href} className={chipClass}>
              <History aria-hidden="true" className="size-3.5 text-mist-500" />
              <span className="tabular-nums">{item.label}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export { QuickPicks };
