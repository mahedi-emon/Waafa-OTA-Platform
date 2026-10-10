"use client";

import { useTranslations } from "next-intl";
import { useSearchCard } from "./SearchCardContext";

/** The open picker's question ("Where are you flying from?"), its sheet title and accessible name. */
export function usePickerTitle(): string {
  const t = useTranslations("Search.pickers");
  const { state } = useSearchCard();
  const picker = state.picker;
  if (!picker) return "";
  if (picker.key === "dates") {
    if (state.flight.trip === "multi-city") return t("datesLeg", { n: picker.leg + 1 });
    return state.flight.trip === "one-way" ? t("datesOneWay") : t("datesRound");
  }
  return t(picker.key);
}
