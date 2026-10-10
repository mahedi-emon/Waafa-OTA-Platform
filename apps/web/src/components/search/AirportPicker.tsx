"use client";

import { useState } from "react";
import { Plane } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Airport } from "@waafa/shared";
import { matchesQuery } from "@/lib/search/highlight";
import { NoMatch } from "./NoMatch";
import { OptionIcon } from "./OptionIcon";
import { OptionList, type PickerOption, type PickerOptionGroup } from "./OptionList";
import { useSearchCard } from "./SearchCardContext";
import { useRemoteSuggestions } from "./useRemoteSuggestions";

type AirportPickerProps = { title: string };

const haystack = (airport: Airport) =>
  `${airport.iata} ${airport.city} ${airport.name} ${airport.country}`;

/**
 * From and To (Pick-m-from, Pick-m-to, Pick-d-from, Pick-d-to): recent airports, Bangladesh first, then popular
 * routes; typing filters the pinned list at once and asks the airport route for the full dataset.
 */
function AirportPicker({ title }: AirportPickerProps) {
  const t = useTranslations("Search");
  const { state, dispatch, data, recentAirports } = useSearchCard();
  const [query, setQuery] = useState("");
  const remote = useRemoteSuggestions<Airport>("/api/search/airports", query);

  const picker = state.picker;
  const side = picker?.key === "to" ? "to" : "from";
  const flight = state.flight;
  const current =
    flight.trip === "multi-city"
      ? flight.legs[picker?.leg ?? 0]?.[side]
      : side === "to"
        ? flight.to
        : flight.from;

  const toOption = (airport: Airport, prefix: string): PickerOption => ({
    key: `${prefix}-${airport.iata}`,
    label: airport.city,
    sub: `${airport.name}, ${airport.country}`,
    code: airport.iata,
    mark: (
      <OptionIcon>
        <Plane />
      </OptionIcon>
    ),
    selected: current?.iata === airport.iata,
    onSelect: () => dispatch({ type: "pickAirport", airport }),
  });

  const q = query.trim();
  let groups: PickerOptionGroup[];
  if (!q) {
    groups = [
      {
        key: "recent",
        label: t("groups.recent"),
        options: recentAirports.map((airport) => toOption(airport, "recent")),
      },
      {
        key: "bd",
        label: t("groups.bangladesh"),
        options: data.pinnedAirports
          .filter((a) => a.countryCode === "BD")
          .map((a) => toOption(a, "bd")),
      },
      {
        key: "abroad",
        label: t("groups.popularAbroad"),
        options: data.pinnedAirports
          .filter((a) => a.countryCode !== "BD")
          .map((a) => toOption(a, "abroad")),
      },
    ];
  } else {
    const seen = new Set<string>();
    const matches = [
      ...data.pinnedAirports.filter((a) => matchesQuery(haystack(a), q)),
      ...(remote.items ?? []),
    ].filter((airport) => (seen.has(airport.iata) ? false : (seen.add(airport.iata), true)));
    groups = [
      {
        key: "bd",
        label: t("groups.inBangladesh"),
        options: matches.filter((a) => a.countryCode === "BD").map((a) => toOption(a, "bd")),
      },
      {
        key: "abroad",
        label: t("groups.abroad"),
        options: matches.filter((a) => a.countryCode !== "BD").map((a) => toOption(a, "abroad")),
      },
    ];
  }

  return (
    <OptionList
      label={title}
      groups={groups}
      query={query}
      onQueryChange={setQuery}
      placeholder={t("placeholders.airport")}
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

export { AirportPicker };
