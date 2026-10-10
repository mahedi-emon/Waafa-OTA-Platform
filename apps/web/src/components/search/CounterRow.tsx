"use client";

import { useId } from "react";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { RollingNumber } from "@/components/motion/RollingNumber";
import { Button } from "@/components/ui/button";
import { countLimits, type CountField } from "@/lib/search/searchState";
import { useSearchCard } from "./SearchCardContext";

type CounterRowProps = { field: CountField; title: string; sub: string };

/**
 * A traveller, room or applicant stepper. − and + turn aria-disabled (not disabled) at a limit, so keyboard focus
 * stays on the button; the new value is announced with its label.
 */
function CounterRow({ field, title, sub }: CounterRowProps) {
  const t = useTranslations("Search.counters");
  const { state, dispatch } = useSearchCard();
  const { value, min, max } = countLimits(state, field);
  const id = useId();

  return (
    <div role="group" aria-labelledby={id} className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p id={id} className="text-[15px] font-semibold text-ink-900">
          {title}
        </p>
        <p className="text-[13px] text-mist-600">{sub}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={t("decrease", { label: title })}
          aria-disabled={value <= min}
          onClick={() => {
            if (value > min) dispatch({ type: "count", field, delta: -1 });
          }}
        >
          <Minus aria-hidden="true" />
        </Button>
        <span
          aria-hidden="true"
          className="w-7 text-center font-display text-lg font-extrabold text-navy-900"
        >
          <RollingNumber value={value} />
        </span>
        <output aria-live="polite" className="sr-only">
          {`${title}, ${value}`}
        </output>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={t("increase", { label: title })}
          aria-disabled={value >= max}
          onClick={() => {
            if (value < max) dispatch({ type: "count", field, delta: 1 });
          }}
        >
          <Plus aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

export { CounterRow };
