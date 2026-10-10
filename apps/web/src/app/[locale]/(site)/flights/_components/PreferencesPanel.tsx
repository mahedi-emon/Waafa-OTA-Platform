"use client";

import { useId } from "react";
import { Moon, Sun, Sunrise, Sunset, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import type { FlightPreferences } from "@waafa/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

type PreferencesPanelProps = {
  value: FlightPreferences;
  onChange: (next: FlightPreferences) => void;
  airlines: Array<{ code: string; name: string }>;
};

const TIMES: Array<{ key: FlightPreferences["times"][number]; icon: LucideIcon }> = [
  { key: "morning", icon: Sunrise },
  { key: "afternoon", icon: Sun },
  { key: "evening", icon: Sunset },
  { key: "night", icon: Moon },
];

/**
 * "Your preferences" (Flights, Flights-m-prefs): stops, departure time, airlines, checked bag and refundable fares.
 * In Manual mode they travel with the request; in Live mode (Phase E) the same rail filters offers.
 */
function PreferencesPanel({ value, onChange, airlines }: PreferencesPanelProps) {
  const t = useTranslations("Flights.prefs");
  const id = useId();
  const set = (patch: Partial<FlightPreferences>) => onChange({ ...value, ...patch });
  const toggle = <T,>(list: T[], item: T) =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2.5">
        <legend id={`${id}-stops`} className="mb-2 text-[14px] font-semibold text-navy-900">
          {t("stops")}
        </legend>
        <RadioGroup
          aria-labelledby={`${id}-stops`}
          value={value.stops}
          onValueChange={(stops) => set({ stops: stops as FlightPreferences["stops"] })}
          className="gap-1"
        >
          {(["any", "direct", "one"] as const).map((stops) => (
            <label
              key={stops}
              className="flex min-h-11 cursor-pointer items-center gap-3 text-[14.5px] text-ink-900"
            >
              <RadioGroupItem value={stops} />
              {t(stops === "any" ? "stopsAny" : stops === "direct" ? "stopsDirect" : "stopsOne")}
            </label>
          ))}
        </RadioGroup>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-[14px] font-semibold text-navy-900">{t("times")}</legend>
        <div className="grid grid-cols-2 gap-2">
          {TIMES.map(({ key, icon: Icon }) => {
            const on = value.times.includes(key);
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                onClick={() => set({ times: toggle(value.times, key) })}
                className={cn(
                  "flex min-h-16 cursor-pointer flex-col items-start justify-center gap-0.5 rounded-xl border px-3 py-2 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                  on
                    ? "border-electric-600 bg-electric-50"
                    : "border-mist-200 bg-white hover:border-mist-300",
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn("size-4", on ? "text-electric-600" : "text-mist-500")}
                />
                <span className="text-[14px] font-semibold text-ink-900">{t(key)}</span>
                <span className="text-[12px] text-mist-600 tabular-nums">{t(`${key}Sub`)}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {airlines.length > 0 ? (
        <fieldset>
          <legend className="mb-1 text-[14px] font-semibold text-navy-900">
            {t("airlines")} <span className="font-normal text-mist-600">· {t("airlinesSub")}</span>
          </legend>
          <ul className="flex flex-col">
            {airlines.map((airline) => {
              const checkboxId = `${id}-airline-${airline.code}`;
              return (
                <li key={airline.code} className="flex min-h-11 items-center gap-3">
                  <Checkbox
                    id={checkboxId}
                    checked={value.airlines.includes(airline.code)}
                    onCheckedChange={() => set({ airlines: toggle(value.airlines, airline.code) })}
                  />
                  <label htmlFor={checkboxId} className="cursor-pointer text-[14.5px] text-ink-900">
                    {airline.name}
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ) : null}

      <fieldset>
        <legend id={`${id}-bag`} className="mb-2 text-[14px] font-semibold text-navy-900">
          {t("bag")}
        </legend>
        <RadioGroup
          aria-labelledby={`${id}-bag`}
          value={value.bag}
          onValueChange={(bag) => set({ bag: bag as FlightPreferences["bag"] })}
          className="gap-1"
        >
          {(["any", "20", "30"] as const).map((bag) => (
            <label
              key={bag}
              className="flex min-h-11 cursor-pointer items-center gap-3 text-[14.5px] text-ink-900"
            >
              <RadioGroupItem value={bag} />
              {t(bag === "any" ? "bagAny" : bag === "20" ? "bag20" : "bag30")}
            </label>
          ))}
        </RadioGroup>
      </fieldset>

      <label className="flex cursor-pointer items-center justify-between gap-4">
        <span>
          <span className="block text-[14.5px] font-semibold text-navy-900">{t("refundable")}</span>
          <span className="block text-[13px] text-mist-600">{t("refundableSub")}</span>
        </span>
        <Switch
          checked={value.refundableOnly}
          onCheckedChange={(refundableOnly) => set({ refundableOnly })}
        />
      </label>
    </div>
  );
}

export { PreferencesPanel };
