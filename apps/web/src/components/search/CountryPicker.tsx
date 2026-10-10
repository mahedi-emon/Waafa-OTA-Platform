"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { VisaRegionSchema, type VisaRegion } from "@waafa/shared";
import { matchesQuery } from "@/lib/search/highlight";
import { CountryCode } from "./CountryCode";
import { NoMatch } from "./NoMatch";
import { OptionList } from "./OptionList";
import { useSearchCard } from "./SearchCardContext";

type CountryPickerProps = { title: string };

/** Visa tab, Visa for (Pick-m-vcountry, Pick-d-vcountry): admin-managed countries grouped by region. */
function CountryPicker({ title }: CountryPickerProps) {
  const t = useTranslations("Search");
  const { state, dispatch, data } = useSearchCard();
  const [query, setQuery] = useState("");
  const q = query.trim();
  const matches = data.visaCountries.filter((country) => !q || matchesQuery(country.name, q));

  const groups = VisaRegionSchema.options.map((region: VisaRegion) => ({
    key: region,
    label: t(`regions.${region}`),
    options: matches
      .filter((country) => country.region === region)
      .map((country) => ({
        key: country.slug,
        label: country.name,
        sub: t("values.passport"),
        mark: <CountryCode code={country.flagCode} />,
        selected: state.visa.country?.slug === country.slug,
        onSelect: () => dispatch({ type: "pickCountry", country }),
      })),
  }));

  return (
    <OptionList
      label={title}
      groups={groups}
      query={query}
      onQueryChange={setQuery}
      placeholder={t("placeholders.country")}
      clearLabel={t("pickers.clear")}
      empty={<NoMatch query={q} />}
    />
  );
}

export { CountryPicker };
