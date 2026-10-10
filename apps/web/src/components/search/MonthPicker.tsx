"use client";

import { CalendarDays, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import { addMonths, formatShortMonth } from "@/lib/search/isoDate";
import { useSearchCard } from "./SearchCardContext";

const MONTHS_AHEAD = 8;

/** Tour tab, When (Pick-m-tmonth, Pick-d-tmonth): "I’m flexible" or one of the next eight months. */
function MonthPicker() {
  const t = useTranslations("Search");
  const { state, dispatch, today } = useSearchCard();
  const current = state.tour.month;
  const months = Array.from({ length: MONTHS_AHEAD }, (_, index) => addMonths(today, index));
  const options: Array<{ key: string; month: string | null; label: string }> = [
    { key: "flex", month: null, label: t("values.flexibleMonth") },
    ...months.map((month) => ({ key: month, month, label: formatShortMonth(month) })),
  ];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(16px+env(safe-area-inset-bottom))] lg:pb-4">
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => {
          const selected = option.month === current;
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={selected}
              onClick={() => dispatch({ type: "pickMonth", month: option.month })}
              className={cn(
                "flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border px-2 text-[14px] font-semibold tabular-nums transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                option.month === null && "col-span-3 flex-row gap-2",
                selected
                  ? "border-electric-600 bg-electric-50 text-navy-900"
                  : "border-mist-200 text-ink-900 hover:border-mist-300 hover:bg-mist-25",
              )}
            >
              {option.month === null ? (
                <Sparkles aria-hidden="true" className="size-4 text-brand-700" />
              ) : (
                <CalendarDays aria-hidden="true" className="size-4 text-mist-500" />
              )}
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-[13px] text-mist-600">{t("monthNote")}</p>
    </div>
  );
}

export { MonthPicker };
