"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { TRIP_TYPES, type TripType } from "@/lib/search/flightOptions";
import { useSearchCard } from "./SearchCardContext";

const LABEL_KEY: Record<TripType, "oneWay" | "roundTrip" | "multiCity"> = {
  "one-way": "oneWay",
  "round-trip": "roundTrip",
  "multi-city": "multiCity",
};

/**
 * One way / Round trip / Multi-city as a segmented radio group with a sliding pill. Native radios (issue 236): arrow
 * keys and one tab stop come from the browser, so the search card carries no Radix roving-focus code.
 */
function TripTypeToggle() {
  const t = useTranslations("Search.trip");
  const { state, dispatch } = useSearchCard();
  const labelId = useId();
  const name = useId();
  const index = TRIP_TYPES.indexOf(state.flight.trip);

  return (
    <div className="flex">
      <span id={labelId} className="sr-only">
        {t("label")}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="relative grid h-12 grid-cols-3 gap-0 rounded-full bg-mist-100 p-0.5"
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-0.5 left-0.5 w-[calc((100%-4px)/3)] rounded-full bg-white shadow-sm transition-transform duration-350 ease-spring"
          style={{ transform: `translateX(${index * 100}%)` }}
        />
        {TRIP_TYPES.map((trip) => (
          <label
            key={trip}
            className="relative z-10 flex cursor-pointer items-center justify-center rounded-full px-3 text-[13.5px] font-semibold whitespace-nowrap text-mist-600 hover:text-navy-900 has-checked:text-navy-900 has-focus-visible:ring-3 has-focus-visible:ring-ring/40 sm:px-4"
          >
            <input
              type="radio"
              name={name}
              value={trip}
              checked={state.flight.trip === trip}
              onChange={() => dispatch({ type: "trip", trip })}
              className="sr-only"
            />
            {t(LABEL_KEY[trip])}
          </label>
        ))}
      </div>
    </div>
  );
}

export { TripTypeToggle };
