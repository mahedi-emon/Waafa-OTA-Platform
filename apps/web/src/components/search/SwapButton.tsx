"use client";

import { ArrowLeftRight, ArrowUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchCard } from "./SearchCardContext";

/**
 * Swaps From and To; the icon turns another half circle on each swap (spring.tab, transform only). Sits between
 * the stacked fields on phones and between the two columns from 768 px.
 */
function SwapButton() {
  const t = useTranslations("Search");
  const { state, dispatch } = useSearchCard();

  return (
    <button
      type="button"
      aria-label={t("swap")}
      onClick={() => dispatch({ type: "swap" })}
      className="absolute top-1/2 right-4 z-10 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-mist-200 bg-white text-brand-700 shadow-sm transition-colors duration-150 outline-none hover:border-electric-200 hover:bg-electric-50 focus-visible:ring-3 focus-visible:ring-ring/40 active:scale-95 md:right-auto md:left-1/2 md:size-10 md:-translate-x-1/2"
    >
      <span
        className="grid place-items-center transition-transform duration-350 ease-spring"
        style={{ transform: `rotate(${state.swaps * 180}deg)` }}
      >
        <ArrowUpDown aria-hidden="true" className="size-[18px] md:hidden" />
        <ArrowLeftRight aria-hidden="true" className="hidden size-[18px] md:block" />
      </span>
    </button>
  );
}

export { SwapButton };
