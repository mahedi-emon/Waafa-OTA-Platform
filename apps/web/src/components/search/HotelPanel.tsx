"use client";

import { useTranslations } from "next-intl";
import { daysBetween } from "@waafa/shared";
import { formatFieldDate, formatWeekday } from "@/lib/search/isoDate";
import { PickerAnchor } from "./PickerAnchor";
import { anchorFieldId, useSearchCard } from "./SearchCardContext";
import { SearchField } from "./SearchField";
import { SearchSubmit } from "./SearchSubmit";

type HotelPanelProps = { pending: boolean };

/** Hotels (FR-SRCH-03): city or hotel, check-in and check-out (up to 30 nights), rooms, guests and nationality. */
function HotelPanel({ pending }: HotelPanelProps) {
  const t = useTranslations("Search");
  const { state, dispatch, data } = useSearchCard();
  const hotel = state.hotel;
  const active = (fieldId: string) =>
    state.picker !== null && anchorFieldId(state.picker, false) === fieldId;
  const nationality =
    data.nationalities.find((n) => n.code === hotel.nationality)?.name ?? hotel.nationality;

  return (
    <div className="flex flex-col gap-2 xl:flex-row xl:items-start">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:flex-1">
        <PickerAnchor fieldId="place" className="col-span-2 md:col-span-1">
          <SearchField
            fieldId="place"
            label={t("fields.where")}
            value={hotel.place ? hotel.place.name : t("empty.place")}
            sub={hotel.place ? hotel.place.country : t("empty.placeSub")}
            empty={!hotel.place}
            active={active("place")}
            onOpen={() => dispatch({ type: "open", key: "place" })}
          />
        </PickerAnchor>
        <PickerAnchor fieldId="checkin">
          <SearchField
            fieldId="checkin"
            label={t("fields.checkIn")}
            value={hotel.checkin ? formatFieldDate(hotel.checkin) : t("empty.chooseDate")}
            sub={hotel.checkin ? formatWeekday(hotel.checkin) : undefined}
            empty={!hotel.checkin}
            active={active("checkin")}
            onOpen={() => dispatch({ type: "open", key: "stay", focus: "start" })}
          />
        </PickerAnchor>
        <SearchField
          fieldId="checkout"
          label={t("fields.checkOut")}
          value={hotel.checkout ? formatFieldDate(hotel.checkout) : t("empty.chooseDate")}
          sub={
            hotel.checkout && hotel.checkin
              ? t("values.nights", { count: daysBetween(hotel.checkin, hotel.checkout) })
              : t("empty.checkoutDate")
          }
          empty={!hotel.checkout}
          active={active("checkout")}
          onOpen={() =>
            dispatch({ type: "open", key: "stay", focus: hotel.checkin ? "end" : "start" })
          }
        />
        <PickerAnchor fieldId="rooms" className="col-span-2 md:col-span-1">
          <SearchField
            fieldId="rooms"
            label={t("fields.roomsGuests")}
            value={t("values.roomsGuests", {
              rooms: hotel.rooms,
              guests: hotel.adults + hotel.childAges.length,
            })}
            sub={t("values.nationality", { country: nationality })}
            active={active("rooms")}
            onOpen={() => dispatch({ type: "open", key: "rooms" })}
          />
        </PickerAnchor>
      </div>
      <SearchSubmit pending={pending} />
    </div>
  );
}

export { HotelPanel };
