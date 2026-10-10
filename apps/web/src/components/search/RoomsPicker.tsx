"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChildAges } from "./ChildAges";
import { CounterRow } from "./CounterRow";
import { PickerFooter } from "./PickerFooter";
import { useSearchCard } from "./SearchCardContext";

/** Hotel rooms, guests, child ages and nationality (Pick-m-rooms, Pick-d-rooms). */
function RoomsPicker() {
  const t = useTranslations("Search");
  const { state, dispatch, data } = useSearchCard();
  const hotel = state.hotel;
  const nationalityId = useId();

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        <div className="divide-y divide-mist-200">
          <CounterRow field="rooms" title={t("counters.rooms")} sub={t("counters.roomsSub")} />
          <CounterRow
            field="hotelAdults"
            title={t("counters.adults")}
            sub={t("counters.adultsSub")}
          />
          <CounterRow
            field="hotelChildren"
            title={t("counters.children")}
            sub={t("counters.hotelChildrenSub")}
          />
        </div>
        <ChildAges scope="hotel" />
        <div className="mt-3 flex flex-col gap-1.5 border-t border-mist-200 pt-4">
          <span id={nationalityId} className="text-[13px] font-semibold text-mist-700">
            {t("options.nationality")}
          </span>
          <Select
            value={hotel.nationality}
            onValueChange={(code) => dispatch({ type: "nationality", code })}
          >
            <SelectTrigger aria-labelledby={nationalityId} className="h-12 w-full rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {data.nationalities.map((nationality) => (
                <SelectItem key={nationality.code} value={nationality.code}>
                  {nationality.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <PickerFooter
        summary={t("values.roomsGuests", {
          rooms: hotel.rooms,
          guests: hotel.adults + hotel.childAges.length,
        })}
      />
    </>
  );
}

export { RoomsPicker };
