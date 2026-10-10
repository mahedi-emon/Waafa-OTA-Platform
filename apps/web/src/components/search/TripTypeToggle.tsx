"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { RadioGroup } from "@/components/ui/radio-group";
import { TRIP_TYPES, type TripType } from "@/lib/search/flightParams";
import { useSearchCard } from "./SearchCardContext";

const LABEL_KEY: Record<TripType, "oneWay" | "roundTrip" | "multiCity"> = {
  "one-way": "oneWay",
  "round-trip": "roundTrip",
  "multi-city": "multiCity",
};

/** One way / Round trip / Multi-city as a segmented radio group with a sliding pill. */
function TripTypeToggle() {
  const t = useTranslations("Search.trip");
  const { state, dispatch } = useSearchCard();
  const labelId = useId();
  const index = TRIP_TYPES.indexOf(state.flight.trip);

  return (
    <div className="flex">
      <span id={labelId} className="sr-only">
        {t("label")}
      </span>
      <RadioGroup
        aria-labelledby={labelId}
        value={state.flight.trip}
        onValueChange={(trip) => dispatch({ type: "trip", trip: trip as TripType })}
        className="relative grid h-12 grid-cols-3 gap-0 rounded-full bg-mist-100 p-0.5"
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-0.5 left-0.5 w-[calc((100%-4px)/3)] rounded-full bg-white shadow-sm transition-transform duration-350 ease-spring"
          style={{ transform: `translateX(${index * 100}%)` }}
        />
        {TRIP_TYPES.map((trip) => (
          <RadioGroupPrimitive.Item
            key={trip}
            value={trip}
            className="relative z-10 cursor-pointer rounded-full px-3 text-[13.5px] font-semibold whitespace-nowrap text-mist-600 outline-none hover:text-navy-900 focus-visible:ring-3 focus-visible:ring-ring/40 data-[state=checked]:text-navy-900 sm:px-4"
          >
            {t(LABEL_KEY[trip])}
          </RadioGroupPrimitive.Item>
        ))}
      </RadioGroup>
    </div>
  );
}

export { TripTypeToggle };
