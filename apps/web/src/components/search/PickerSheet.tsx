"use client";

import { useState } from "react";
import { cn } from "cn";
import type { PickerKey } from "@/lib/search/searchState";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { PickerSheetBody } from "./PickerSheetBody";
import {
  SearchCardProvider,
  anchorFieldId,
  returnFocusTo,
  useSearchCard,
} from "./SearchCardContext";

const FULL_SCREEN = new Set<PickerKey>([
  "from",
  "to",
  "place",
  "destination",
  "country",
  "dates",
  "stay",
]);

/**
 * Phones and tablets (below 1024 px): pickers open as vaul sheets with drag-to-close (MOTION.md "Picker open").
 * Lists and calendars take the full screen; steppers and months sit in a bottom sheet. While the sheet closes it
 * keeps showing the last picker, so nothing collapses mid-animation.
 */
function PickerSheet() {
  const card = useSearchCard();
  const { state, dispatch, isDesktop } = card;
  const [last, setLast] = useState(state.picker);
  if (state.picker && state.picker !== last) setLast(state.picker);

  const shown = state.picker ?? last;
  const open = !isDesktop && state.picker !== null;
  const multi = state.tab === "flight" && state.flight.trip === "multi-city";
  const frozen = state.picker ? card : { ...card, state: { ...state, picker: last } };

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) dispatch({ type: "close" });
      }}
      repositionInputs={false}
    >
      <DrawerContent
        data-search-picker={open ? "" : undefined}
        aria-describedby={undefined}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (last) returnFocusTo(anchorFieldId(last, multi));
        }}
        className={cn(
          "rounded-t-[28px] border-0 bg-white",
          shown && FULL_SCREEN.has(shown.key)
            ? "h-[calc(100dvh-12px)] max-h-none!"
            : "max-h-[88dvh]",
        )}
      >
        {shown ? (
          <SearchCardProvider value={frozen}>
            <PickerSheetBody />
          </SearchCardProvider>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

export { PickerSheet };
