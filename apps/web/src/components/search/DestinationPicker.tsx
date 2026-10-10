"use client";

import { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { matchesQuery } from "@/lib/search/highlight";
import type { DestinationOption } from "@/lib/search/searchState";
import { CountryCode } from "./CountryCode";
import { OptionIcon } from "./OptionIcon";
import { OptionList, type PickerOption } from "./OptionList";
import { useSearchCard } from "./SearchCardContext";

type DestinationPickerProps = { title: string };

/**
 * Tour tab, Where to: admin-managed destinations, Bangladesh first. Anything typed can be searched as free text,
 * so a place that is not listed still reaches the tour list (FR-SRCH-04).
 */
function DestinationPicker({ title }: DestinationPickerProps) {
  const t = useTranslations("Search");
  const { state, dispatch, data } = useSearchCard();
  const [query, setQuery] = useState(state.tour.destination ? "" : state.tour.search);
  const q = query.trim();
  const matches = data.destinations.filter((d) => !q || matchesQuery(`${d.name} ${d.subtitle}`, q));

  const toOption = (destination: DestinationOption): PickerOption => ({
    key: destination.slug,
    label: destination.name,
    sub: destination.subtitle,
    mark: destination.countryCode ? (
      <CountryCode code={destination.countryCode} />
    ) : (
      <OptionIcon>
        <MapPin />
      </OptionIcon>
    ),
    selected: state.tour.destination?.slug === destination.slug,
    onSelect: () => dispatch({ type: "pickDestination", destination }),
  });

  const freeText: PickerOption[] = q
    ? [
        {
          key: `search-${q}`,
          label: t("groups.searchFor", { query: q }),
          sub: t("groups.searchForSub"),
          mark: (
            <OptionIcon>
              <Search />
            </OptionIcon>
          ),
          onSelect: () => dispatch({ type: "pickDestination", destination: null, search: q }),
        },
      ]
    : [];

  return (
    <OptionList
      label={title}
      groups={[
        {
          key: "bd",
          label: t("groups.inBangladesh"),
          options: matches.filter((d) => d.domestic).map(toOption),
        },
        {
          key: "abroad",
          label: t("groups.abroad"),
          options: matches.filter((d) => !d.domestic).map(toOption),
        },
        { key: "text", options: freeText },
      ]}
      query={query}
      onQueryChange={setQuery}
      placeholder={t("placeholders.destination")}
      clearLabel={t("pickers.clear")}
    />
  );
}

export { DestinationPicker };
