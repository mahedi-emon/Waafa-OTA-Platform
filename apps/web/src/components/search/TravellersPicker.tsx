"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CABIN_CLASSES, type CabinClass } from "@/lib/search/flightParams";
import { travellerTotal } from "@/lib/search/searchState";
import { ChildAges } from "./ChildAges";
import { CounterRow } from "./CounterRow";
import { PickerFooter } from "./PickerFooter";
import { useSearchCard } from "./SearchCardContext";

const ANY_AIRLINE = "any";

/** Flight travellers, cabin class and options (Pick-m-pax, Pick-d-pax). */
function TravellersPicker() {
  const t = useTranslations("Search");
  const { state, dispatch, data } = useSearchCard();
  const flight = state.flight;
  const cabinId = useId();
  const optionsId = useId();
  const airlineId = useId();

  const toggles = [
    {
      option: "direct",
      title: t("options.direct"),
      sub: t("options.directSub"),
      on: flight.direct,
    },
    { option: "flex", title: t("options.flex"), sub: t("options.flexSub"), on: flight.flex },
    {
      option: "student",
      title: t("options.student"),
      sub: t("options.studentSub"),
      on: flight.fare === "student",
    },
  ] as const;

  const detail = [
    t(`cabins.${flight.cabin}`),
    flight.direct ? t("values.directOnly") : null,
    flight.flex ? t("values.flexDays") : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        <div className="divide-y divide-mist-200">
          <CounterRow field="adults" title={t("counters.adults")} sub={t("counters.adultsSub")} />
          <CounterRow
            field="children"
            title={t("counters.children")}
            sub={t("counters.childrenSub")}
          />
          <CounterRow
            field="infants"
            title={t("counters.infants")}
            sub={t("counters.infantsSub")}
          />
        </div>
        <ChildAges scope="flight" />

        <div className="border-t border-mist-200 pt-4">
          <p id={cabinId} className="mb-2 text-[13px] font-semibold text-mist-700">
            {t("options.cabin")}
          </p>
          <RadioGroup
            aria-labelledby={cabinId}
            value={flight.cabin}
            onValueChange={(value) => dispatch({ type: "cabin", cabin: value as CabinClass })}
            className="grid grid-cols-2 gap-2"
          >
            {CABIN_CLASSES.map((cabin) => (
              <label
                key={cabin}
                className={cn(
                  "flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl border px-3 text-[14.5px] font-medium transition-colors",
                  flight.cabin === cabin
                    ? "border-electric-600 bg-electric-50 text-navy-900"
                    : "border-mist-200 text-ink-900 hover:border-mist-300",
                )}
              >
                <RadioGroupItem value={cabin} />
                {t(`cabins.${cabin}`)}
              </label>
            ))}
          </RadioGroup>
        </div>

        <div
          className="mt-4 border-t border-mist-200 pt-4"
          role="group"
          aria-labelledby={optionsId}
        >
          <p id={optionsId} className="mb-1 text-[13px] font-semibold text-mist-700">
            {t("options.more")}
          </p>
          {toggles.map((toggle) => (
            <label
              key={toggle.option}
              className="flex cursor-pointer items-center justify-between gap-4 py-2.5"
            >
              <span className="min-w-0">
                <span className="block text-[15px] font-medium text-ink-900">{toggle.title}</span>
                <span className="block text-[13px] text-mist-600">{toggle.sub}</span>
              </span>
              <Switch
                checked={toggle.on}
                onCheckedChange={() => dispatch({ type: "toggle", option: toggle.option })}
              />
            </label>
          ))}
          <div className="mt-2 flex flex-col gap-1.5">
            <span id={airlineId} className="text-[13px] font-semibold text-mist-700">
              {t("options.airline")}
            </span>
            <Select
              value={flight.airline ?? ANY_AIRLINE}
              onValueChange={(code) =>
                dispatch({ type: "airline", code: code === ANY_AIRLINE ? null : code })
              }
            >
              <SelectTrigger aria-labelledby={airlineId} className="h-12 w-full rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY_AIRLINE}>{t("options.anyAirline")}</SelectItem>
                {data.airlines.map((airline) => (
                  <SelectItem key={airline.code} value={airline.code}>
                    {airline.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <PickerFooter
        summary={t("values.travellers", { count: travellerTotal(flight) })}
        detail={detail}
      />
    </>
  );
}

export { TravellersPicker };
