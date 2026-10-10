"use client";

import { useState } from "react";
import { BedDouble, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import type { HotelPlace } from "@waafa/shared";
import { matchesQuery } from "@/lib/search/highlight";
import { NoMatch } from "./NoMatch";
import { OptionIcon } from "./OptionIcon";
import { OptionList, type PickerOption } from "./OptionList";
import { useSearchCard } from "./SearchCardContext";
import { useRemoteSuggestions } from "./useRemoteSuggestions";

type PlacePickerProps = { title: string };

/** Hotel tab, Where (Pick-m-hcity): popular cities first; typing searches cities and hotels. */
function PlacePicker({ title }: PlacePickerProps) {
  const t = useTranslations("Search");
  const { state, dispatch, data } = useSearchCard();
  const [query, setQuery] = useState("");
  const remote = useRemoteSuggestions<HotelPlace>("/api/search/places", query);
  const q = query.trim();

  const seen = new Set<string>();
  const places = (
    q
      ? [
          ...data.hotelPlaces.filter((p) => matchesQuery(`${p.name} ${p.city} ${p.country}`, q)),
          ...(remote.items ?? []),
        ]
      : data.hotelPlaces
  ).filter((place) => (seen.has(place.id) ? false : (seen.add(place.id), true)));

  const toOption = (place: HotelPlace): PickerOption => ({
    key: place.id,
    label: place.name,
    sub:
      place.kind === "hotel"
        ? `${t("values.hotelIn", { city: place.city })}, ${place.country}`
        : place.country,
    mark: <OptionIcon>{place.kind === "hotel" ? <BedDouble /> : <MapPin />}</OptionIcon>,
    selected: state.hotel.place?.id === place.id,
    onSelect: () => dispatch({ type: "pickPlace", place }),
  });

  return (
    <OptionList
      label={title}
      groups={[
        {
          key: "bd",
          label: t("groups.inBangladesh"),
          options: places.filter((p) => p.country === "Bangladesh").map(toOption),
        },
        {
          key: "abroad",
          label: t("groups.abroad"),
          options: places.filter((p) => p.country !== "Bangladesh").map(toOption),
        },
      ]}
      query={query}
      onQueryChange={setQuery}
      placeholder={t("placeholders.place")}
      clearLabel={t("pickers.clear")}
      loading={remote.loading}
      empty={<NoMatch query={q} />}
      bottom={
        remote.error ? (
          <p className="px-3 py-2 text-[13px] text-danger-600">{t("noMatch.error")}</p>
        ) : null
      }
    />
  );
}

export { PlacePicker };
