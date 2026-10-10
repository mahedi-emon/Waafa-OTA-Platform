"use client";

import { AirportPicker } from "./AirportPicker";
import { CountryPicker } from "./CountryPicker";
import { DatesPicker } from "./DatesPicker";
import { DestinationPicker } from "./DestinationPicker";
import { MonthPicker } from "./MonthPicker";
import { PartyPicker } from "./PartyPicker";
import { PlacePicker } from "./PlacePicker";
import { RoomsPicker } from "./RoomsPicker";
import { TravellersPicker } from "./TravellersPicker";
import { VisaTypePicker } from "./VisaTypePicker";
import { useSearchCard } from "./SearchCardContext";

type PickerBodyProps = { title: string };

/** The content of the open picker; the same body renders in the desktop popover and the phone sheet. */
function PickerBody({ title }: PickerBodyProps) {
  const { state } = useSearchCard();
  const picker = state.picker;
  if (!picker) return null;
  // A new key remounts the picker, so its search box starts empty for each field.
  const key = `${picker.key}-${picker.leg}`;
  switch (picker.key) {
    case "from":
    case "to":
      return <AirportPicker key={key} title={title} />;
    case "dates":
    case "stay":
      return <DatesPicker />;
    case "travellers":
      return <TravellersPicker />;
    case "place":
      return <PlacePicker title={title} />;
    case "rooms":
      return <RoomsPicker />;
    case "destination":
      return <DestinationPicker title={title} />;
    case "month":
      return <MonthPicker />;
    case "party":
      return <PartyPicker kind="tour" />;
    case "country":
      return <CountryPicker title={title} />;
    case "visaType":
      return <VisaTypePicker title={title} />;
    case "applicants":
      return <PartyPicker kind="visa" />;
  }
}

export { PickerBody };
