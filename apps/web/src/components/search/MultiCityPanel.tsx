"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { MAX_MULTI_CITY_LEGS } from "@waafa/shared";
import { Button } from "@/components/ui/button";
import { formatFieldDate, formatWeekday } from "@/lib/search/isoDate";
import { travellerTotal } from "@/lib/search/searchState";
import { PickerAnchor } from "./PickerAnchor";
import { anchorFieldId, useSearchCard } from "./SearchCardContext";
import { SearchField } from "./SearchField";
import { SearchSubmit } from "./SearchSubmit";

type MultiCityPanelProps = { pending: boolean };

/** Multi-city (Pick-m-multi): two to five flights, each with From, To and a date; the next flight starts where the last one landed. */
function MultiCityPanel({ pending }: MultiCityPanelProps) {
  const t = useTranslations("Search");
  const { state, dispatch } = useSearchCard();
  const flight = state.flight;
  const active = (fieldId: string) =>
    state.picker !== null && anchorFieldId(state.picker, true) === fieldId;
  const canRemove = flight.legs.length > 2;

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-2">
        {flight.legs.map((leg, index) => {
          const n = index + 1;
          return (
            <li
              key={index}
              className="rounded-2xl border border-mist-200 bg-mist-25 p-2 xl:flex xl:items-start xl:gap-2 xl:border-0 xl:bg-transparent xl:p-0"
            >
              <div className="flex min-h-9 items-center justify-between gap-2 px-1.5 pb-1.5 xl:min-h-16 xl:w-20 xl:shrink-0 xl:p-0">
                <span className="font-display text-[13.5px] font-bold text-navy-900">
                  {t("legs.flight", { n })}
                </span>
                {canRemove ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("legs.remove", { n })}
                    onClick={() => dispatch({ type: "removeLeg", index })}
                    className="text-mist-600 xl:hidden"
                  >
                    <X aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-2 xl:flex-[2.2]">
                {(["from", "to"] as const).map((side) => {
                  const fieldId = `legs.${index}.${side}`;
                  const airport = leg[side];
                  return (
                    <PickerAnchor key={side} fieldId={fieldId}>
                      <SearchField
                        fieldId={fieldId}
                        label={t(`fields.${side}`)}
                        value={airport ? airport.city : t(`empty.${side}`)}
                        code={airport?.iata}
                        empty={!airport}
                        active={active(fieldId)}
                        onOpen={() => dispatch({ type: "open", key: side, leg: index })}
                      />
                    </PickerAnchor>
                  );
                })}
              </div>
              <PickerAnchor fieldId={`legs.${index}.date`} className="mt-2 xl:mt-0 xl:flex-1">
                <SearchField
                  fieldId={`legs.${index}.date`}
                  label={t("fields.date")}
                  value={leg.date ? formatFieldDate(leg.date) : t("empty.chooseDate")}
                  sub={leg.date ? formatWeekday(leg.date) : undefined}
                  empty={!leg.date}
                  active={active(`legs.${index}.date`)}
                  onOpen={() => dispatch({ type: "open", key: "dates", leg: index })}
                />
              </PickerAnchor>
              <div className="hidden xl:flex xl:h-16 xl:w-11 xl:items-center xl:justify-center">
                {canRemove ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("legs.remove", { n })}
                    onClick={() => dispatch({ type: "removeLeg", index })}
                    className="text-mist-600"
                  >
                    <X aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-col gap-2 xl:flex-row xl:items-start">
        <div className="flex min-h-11 items-center xl:h-16">
          {flight.legs.length < MAX_MULTI_CITY_LEGS ? (
            <Button type="button" variant="soft" onClick={() => dispatch({ type: "addLeg" })}>
              <Plus aria-hidden="true" />
              {t("legs.add")}
            </Button>
          ) : (
            <p className="text-[13px] text-mist-600">{t("legs.max")}</p>
          )}
        </div>
        <PickerAnchor fieldId="travellers" className="xl:ml-auto xl:w-64">
          <SearchField
            fieldId="travellers"
            label={t("fields.travellers")}
            value={t("values.travellers", { count: travellerTotal(flight) })}
            sub={t(`cabins.${flight.cabin}`)}
            active={active("travellers")}
            onOpen={() => dispatch({ type: "open", key: "travellers" })}
          />
        </PickerAnchor>
        <SearchSubmit pending={pending} />
      </div>
    </div>
  );
}

export { MultiCityPanel };
