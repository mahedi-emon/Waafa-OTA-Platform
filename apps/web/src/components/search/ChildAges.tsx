"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchCard } from "./SearchCardContext";

type ChildAgesProps = { scope: "flight" | "hotel" };

/** One age select per child (FR-SRCH-02, FR-SRCH-03): 2–11 for flights, under 1 to 11 for hotels. */
function ChildAges({ scope }: ChildAgesProps) {
  const t = useTranslations("Search.counters");
  const { state, dispatch } = useSearchCard();
  const id = useId();
  const ages = scope === "flight" ? state.flight.childAges : state.hotel.childAges;
  const options = Array.from(
    { length: scope === "flight" ? 10 : 12 },
    (_, index) => index + (scope === "flight" ? 2 : 0),
  );
  const missing =
    (scope === "flight" ? state.errors.travellers : state.errors.rooms) === "childAgeRequired";
  if (ages.length === 0) return null;

  return (
    <fieldset className="border-t border-mist-200 pt-3 pb-1">
      <legend className="sr-only">{t(scope === "flight" ? "agesFlight" : "agesHotel")}</legend>
      <p aria-hidden="true" className="mb-2 text-[13px] font-semibold text-mist-700">
        {t(scope === "flight" ? "agesFlight" : "agesHotel")}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {ages.map((age, index) => {
          const labelId = `${id}-${index}`;
          return (
            <div key={index} className="flex flex-col gap-1">
              <span id={labelId} className="text-[13px] text-mist-600">
                {t("child", { n: index + 1 })}
              </span>
              <Select
                value={age === null ? undefined : String(age)}
                onValueChange={(value) =>
                  dispatch({ type: "childAge", scope, index, age: Number.parseInt(value, 10) })
                }
              >
                <SelectTrigger
                  aria-labelledby={labelId}
                  aria-invalid={missing && age === null ? true : undefined}
                  className={cn(
                    "h-12 w-full rounded-xl",
                    missing && age === null && "border-danger-600",
                  )}
                >
                  <SelectValue placeholder={t("selectAge")} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {t("age", { age: option })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

export { ChildAges };
