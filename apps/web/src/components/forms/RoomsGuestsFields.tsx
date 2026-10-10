"use client";

import { useId } from "react";
import { CircleAlert } from "lucide-react";
import { NumberStepper } from "@/components/forms/NumberStepper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type RoomsGuestsValue = { rooms: number; adults: number; childAges: number[] };

type RoomsGuestsFieldsProps = {
  value: RoomsGuestsValue;
  onChange: (value: RoomsGuestsValue) => void;
  maxRooms: number;
  /** Per room: adults and children the hotel search allows. */
  maxAdultsPerRoom: number;
  maxChildrenPerRoom: number;
  error?: string;
  labels: {
    legend: string;
    rooms: string;
    adults: string;
    adultsSub: string;
    children: string;
    childrenSub: string;
    /** "{n}" is replaced with the child's number. */
    childAge: string;
    /** "{age}" is replaced; 0 reads as "Under 1". */
    years: string;
    underOne: string;
    /** "{who}" is replaced with the row label. */
    decrease: string;
    increase: string;
  };
};

const AGES = Array.from({ length: 18 }, (_, age) => age);

/** Rooms, adults and children (with ages 0 to 17) for a hotel request; every room keeps at least one adult. */
function RoomsGuestsFields({
  value,
  onChange,
  maxRooms,
  maxAdultsPerRoom,
  maxChildrenPerRoom,
  error,
  labels,
}: RoomsGuestsFieldsProps) {
  const id = useId();
  const step = (who: string) => ({
    decrease: labels.decrease.replace("{who}", who),
    increase: labels.increase.replace("{who}", who),
  });
  const ageLabel = (age: number) =>
    age === 0 ? labels.underOne : labels.years.replace("{age}", String(age));

  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined} className="flex flex-col gap-1">
      <legend className="mb-1 text-[14px] font-semibold text-ink-900">{labels.legend}</legend>
      <div className="flex flex-col divide-y divide-mist-100 rounded-xl border border-mist-200 px-4">
        <NumberStepper
          label={labels.rooms}
          value={value.rooms}
          min={1}
          max={Math.min(maxRooms, value.adults)}
          onChange={(rooms) => onChange({ ...value, rooms })}
          labels={step(labels.rooms)}
        />
        <NumberStepper
          label={labels.adults}
          sub={labels.adultsSub}
          value={value.adults}
          min={value.rooms}
          max={value.rooms * maxAdultsPerRoom}
          onChange={(adults) => onChange({ ...value, adults })}
          labels={step(labels.adults)}
        />
        <NumberStepper
          label={labels.children}
          sub={labels.childrenSub}
          value={value.childAges.length}
          min={0}
          max={value.rooms * maxChildrenPerRoom}
          onChange={(count) =>
            onChange({
              ...value,
              childAges:
                count > value.childAges.length
                  ? [
                      ...value.childAges,
                      ...Array.from({ length: count - value.childAges.length }, () => 8),
                    ]
                  : value.childAges.slice(0, count),
            })
          }
          labels={step(labels.children)}
        />
        {value.childAges.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 py-3 sm:grid-cols-3">
            {value.childAges.map((age, index) => (
              <div key={index} className="flex flex-col gap-1">
                <label
                  htmlFor={`${id}-age-${index}`}
                  className="text-[13px] font-medium text-mist-700"
                >
                  {labels.childAge.replace("{n}", String(index + 1))}
                </label>
                <Select
                  value={String(age)}
                  onValueChange={(next) =>
                    onChange({
                      ...value,
                      childAges: value.childAges.map((item, i) =>
                        i === index ? Number(next) : item,
                      ),
                    })
                  }
                >
                  <SelectTrigger id={`${id}-age-${index}`} className="h-11 w-full rounded-xl">
                    <SelectValue>{ageLabel(age)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {AGES.map((item) => (
                      <SelectItem key={item} value={String(item)}>
                        {ageLabel(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-[13px] text-danger-600">
          <CircleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export { RoomsGuestsFields };
