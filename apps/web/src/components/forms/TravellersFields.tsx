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

export type TravellersValue = { adults: number; childAges: number[]; infants: number };

type TravellersFieldsProps = {
  value: TravellersValue;
  onChange: (value: TravellersValue) => void;
  /** Most travellers in one request (FR-SRCH-02: 9). */
  max: number;
  error?: string;
  labels: {
    legend: string;
    adults: string;
    adultsSub: string;
    children: string;
    childrenSub: string;
    infants: string;
    infantsSub: string;
    /** "{n}" is replaced with the child's number. */
    childAge: string;
    /** "{age}" is replaced. */
    years: string;
    /** "{who}" is replaced with the row label, e.g. "One fewer adult". */
    decrease: string;
    increase: string;
  };
};

const AGES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/**
 * Adults, children (with each child's age, 2 to 11) and infants for a request step, so a visitor who arrives without a
 * search still tells the expert who is travelling. Infants can't outnumber adults; the total stays within `max`.
 */
function TravellersFields({ value, onChange, max, error, labels }: TravellersFieldsProps) {
  const id = useId();
  const total = value.adults + value.childAges.length + value.infants;
  const room = max - total;
  const step = (who: string) => ({
    decrease: labels.decrease.replace("{who}", who),
    increase: labels.increase.replace("{who}", who),
  });

  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined} className="flex flex-col gap-1">
      <legend className="mb-1 text-[14px] font-semibold text-ink-900">{labels.legend}</legend>
      <div className="flex flex-col divide-y divide-mist-100 rounded-xl border border-mist-200 px-4">
        <NumberStepper
          label={labels.adults}
          sub={labels.adultsSub}
          value={value.adults}
          min={1}
          max={Math.min(max, value.adults + room)}
          onChange={(adults) =>
            onChange({ ...value, adults, infants: Math.min(value.infants, adults) })
          }
          labels={step(labels.adults)}
        />
        <NumberStepper
          label={labels.children}
          sub={labels.childrenSub}
          value={value.childAges.length}
          min={0}
          max={value.childAges.length + room}
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
            {value.childAges.map((age, index) => {
              const label = labels.childAge.replace("{n}", String(index + 1));
              return (
                <div key={index} className="flex flex-col gap-1">
                  <label
                    htmlFor={`${id}-age-${index}`}
                    className="text-[13px] font-medium text-mist-700"
                  >
                    {label}
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
                      <SelectValue>{labels.years.replace("{age}", String(age))}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {AGES.map((item) => (
                        <SelectItem key={item} value={String(item)}>
                          {labels.years.replace("{age}", String(item))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        ) : null}
        <NumberStepper
          label={labels.infants}
          sub={labels.infantsSub}
          value={value.infants}
          min={0}
          max={Math.min(value.adults, value.infants + room)}
          onChange={(infants) => onChange({ ...value, infants })}
          labels={step(labels.infants)}
        />
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

export { TravellersFields };
