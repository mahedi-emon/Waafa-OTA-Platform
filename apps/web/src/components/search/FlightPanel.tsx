"use client";

import { useTranslations } from "next-intl";
import { daysBetween } from "@waafa/shared";
import { formatFieldDate, formatWeekday } from "@/lib/search/isoDate";
import { travellerTotal } from "@/lib/search/searchState";
import { PickerAnchor } from "./PickerAnchor";
import { anchorFieldId, useSearchCard } from "./SearchCardContext";
import { SearchField } from "./SearchField";
import { SearchSubmit } from "./SearchSubmit";
import { SwapButton } from "./SwapButton";

type FlightPanelProps = { pending: boolean };

/** One-way and round-trip flights: From ⇄ To, Departure, Return, Travellers (FR-SRCH-02). */
function FlightPanel({ pending }: FlightPanelProps) {
  const t = useTranslations("Search");
  const { state, dispatch } = useSearchCard();
  const flight = state.flight;
  const active = (fieldId: string) =>
    state.picker !== null && anchorFieldId(state.picker, false) === fieldId;
  const roundTrip = flight.trip === "round-trip";

  const sub = [
    t(`cabins.${flight.cabin}`),
    flight.fare === "student" ? t("values.studentFare") : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-2 xl:flex-row xl:items-start">
      <div className="relative grid gap-2 md:grid-cols-2 xl:flex-[2.2]">
        {(["from", "to"] as const).map((side) => {
          const airport = flight[side];
          return (
            <PickerAnchor key={side} fieldId={side}>
              <SearchField
                fieldId={side}
                label={t(`fields.${side}`)}
                value={airport ? airport.city : t(`empty.${side}`)}
                code={airport?.iata}
                sub={airport ? airport.name : t("empty.airportSub")}
                empty={!airport}
                active={active(side)}
                onOpen={() => dispatch({ type: "open", key: side })}
                buttonClassName={side === "from" ? "pr-16 md:pr-8" : "pr-16 md:pr-4 md:pl-8"}
              />
            </PickerAnchor>
          );
        })}
        <SwapButton />
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:flex-[2.6]">
        <PickerAnchor fieldId="depart">
          <SearchField
            fieldId="depart"
            label={t("fields.departure")}
            value={flight.depart ? formatFieldDate(flight.depart) : t("empty.chooseDate")}
            sub={flight.depart ? formatWeekday(flight.depart) : undefined}
            empty={!flight.depart}
            active={active("depart")}
            onOpen={() => dispatch({ type: "open", key: "dates", focus: "start" })}
          />
        </PickerAnchor>
        <SearchField
          fieldId="return"
          label={t("fields.return")}
          value={
            roundTrip
              ? flight.return
                ? formatFieldDate(flight.return)
                : t("empty.chooseDate")
              : t("empty.addReturn")
          }
          sub={
            roundTrip
              ? flight.return && flight.depart
                ? t("values.nights", { count: daysBetween(flight.depart, flight.return) })
                : t("empty.returnDate")
              : t("empty.optional")
          }
          empty={!roundTrip || !flight.return}
          active={active("return")}
          onOpen={() =>
            dispatch(
              roundTrip ? { type: "open", key: "dates", focus: "end" } : { type: "addReturn" },
            )
          }
        />
        <PickerAnchor fieldId="travellers" className="col-span-2 md:col-span-1">
          <SearchField
            fieldId="travellers"
            label={t("fields.travellers")}
            value={t("values.travellers", { count: travellerTotal(flight) })}
            sub={sub}
            active={active("travellers")}
            onOpen={() => dispatch({ type: "open", key: "travellers" })}
          />
        </PickerAnchor>
      </div>
      <SearchSubmit pending={pending} />
    </div>
  );
}

export { FlightPanel };
