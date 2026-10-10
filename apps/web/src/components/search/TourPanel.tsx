"use client";

import { useTranslations } from "next-intl";
import { formatMonth } from "@/lib/search/isoDate";
import { PickerAnchor } from "./PickerAnchor";
import { anchorFieldId, useSearchCard } from "./SearchCardContext";
import { SearchField } from "./SearchField";
import { SearchSubmit } from "./SearchSubmit";

type TourPanelProps = { pending: boolean };

/** Tours (FR-SRCH-04): where to, when and who; opens the filtered tour list. */
function TourPanel({ pending }: TourPanelProps) {
  const t = useTranslations("Search");
  const { state, dispatch } = useSearchCard();
  const tour = state.tour;
  const active = (fieldId: string) =>
    state.picker !== null && anchorFieldId(state.picker, false) === fieldId;
  const where = tour.destination?.name ?? (tour.search || null);

  return (
    <div className="flex flex-col gap-2 xl:flex-row xl:items-start">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:flex-1">
        <PickerAnchor fieldId="destination" className="col-span-2 md:col-span-1">
          <SearchField
            fieldId="destination"
            label={t("fields.whereTo")}
            value={where ?? t("empty.destination")}
            sub={tour.destination?.subtitle ?? t("empty.destinationSub")}
            empty={!where}
            active={active("destination")}
            onOpen={() => dispatch({ type: "open", key: "destination" })}
          />
        </PickerAnchor>
        <PickerAnchor fieldId="month">
          <SearchField
            fieldId="month"
            label={t("fields.when")}
            value={tour.month ? formatMonth(tour.month) : t("values.flexibleMonth")}
            sub={tour.month ? t("values.monthSub") : t("values.flexibleMonthSub")}
            active={active("month")}
            onOpen={() => dispatch({ type: "open", key: "month" })}
          />
        </PickerAnchor>
        <PickerAnchor fieldId="party">
          <SearchField
            fieldId="party"
            label={t("fields.travellers")}
            value={
              tour.children
                ? t("values.adultsChildren", { adults: tour.adults, children: tour.children })
                : t("values.adults", { count: tour.adults })
            }
            sub={t("values.tourKind")}
            active={active("party")}
            onOpen={() => dispatch({ type: "open", key: "party" })}
          />
        </PickerAnchor>
      </div>
      <SearchSubmit pending={pending} />
    </div>
  );
}

export { TourPanel };
