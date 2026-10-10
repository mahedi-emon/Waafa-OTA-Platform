"use client";

import { createContext, use, type Dispatch } from "react";
import type { Airport } from "@waafa/shared";
import type { ErrorCode, OpenPicker, SearchAction, SearchState } from "@/lib/search/searchState";
import type { SearchCardData } from "./searchCardData";

export type SearchCardContextValue = {
  state: SearchState;
  dispatch: Dispatch<SearchAction>;
  data: SearchCardData;
  isDesktop: boolean;
  /** Today's date in Asia/Dhaka ("2026-10-10"); empty until the card has hydrated. */
  today: string;
  /** Changes on every failed submit, so fields with errors shake once each time. */
  errorNonce: number;
  /** Airports from the visitor's recent flight searches (browser only). */
  recentAirports: Airport[];
};

const SearchCardContext = createContext<SearchCardContextValue | null>(null);

export const SearchCardProvider = SearchCardContext.Provider;

export function useSearchCard(): SearchCardContextValue {
  const value = use(SearchCardContext);
  if (!value) throw new Error("useSearchCard must be used inside the search card");
  return value;
}

/** DOM id of a field: "legs.1.to" → "search-legs-1-to". */
export function fieldDomId(fieldId: string): string {
  return `search-${fieldId.replaceAll(".", "-")}`;
}

/** The field a picker opens from, so the desktop popover anchors to it and focus returns to it. */
export function anchorFieldId(picker: OpenPicker, multiCity: boolean): string {
  switch (picker.key) {
    case "from":
    case "to":
      return multiCity ? `legs.${picker.leg}.${picker.key}` : picker.key;
    case "dates":
      if (multiCity) return `legs.${picker.leg}.date`;
      return picker.focus === "end" ? "return" : "depart";
    case "stay":
      return picker.focus === "end" ? "checkout" : "checkin";
    default:
      return picker.key;
  }
}

/** The validation error shown under a field ("stay" errors sit under Check-in). */
export function fieldErrorCode(state: SearchState, fieldId: string): ErrorCode | undefined {
  if (fieldId === "checkin") return state.errors.stay;
  return state.errors[fieldId];
}

/** Error keys from validation → the field that shows them. */
export function errorKeyToFieldId(key: string): string {
  return key === "stay" ? "checkin" : key;
}

/** The field a desktop popover hangs from: date pickers stay under the first date field while focus moves. */
export function popoverFieldId(picker: OpenPicker, multiCity: boolean): string {
  if (picker.key === "dates" && !multiCity) return "depart";
  if (picker.key === "stay") return "checkin";
  return anchorFieldId(picker, multiCity);
}

/** After a picker closes, focus goes back to its field unless another picker has opened meanwhile. */
export function returnFocusTo(fieldId: string): void {
  window.requestAnimationFrame(() => {
    if (document.querySelector("[data-search-picker]")) return;
    document.getElementById(fieldDomId(fieldId))?.focus({ preventScroll: true });
  });
}
