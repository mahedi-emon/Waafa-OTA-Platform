"use client";

import { useEffect, useState } from "react";
import { cn } from "cn";
import type { PickerKey } from "@/lib/search/searchState";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { PickerBody } from "./PickerBody";
import { fieldDomId, returnFocusTo, useSearchCard } from "./SearchCardContext";
import { usePickerTitle } from "./usePickerTitle";

type PickerPopoverProps = { fieldId: string };

const PREFERRED_SPACE = 520;
const HEADER_CLEARANCE = 96;

const WIDTH: Record<PickerKey, string> = {
  from: "w-[440px]",
  to: "w-[440px]",
  place: "w-[440px]",
  destination: "w-[440px]",
  country: "w-[440px]",
  visaType: "w-[400px]",
  dates: "w-[700px]",
  stay: "w-[700px]",
  travellers: "w-[440px]",
  rooms: "w-[420px]",
  party: "w-[400px]",
  applicants: "w-[400px]",
  month: "w-[440px]",
};

/**
 * Desktop picker (Pick-d-* boards): a popover hanging from its field, 180 ms fade and a small scale from Radix.
 * Loaded on demand, so Radix Popper and the picker lists stay out of the first page load.
 */
function PickerPopover({ fieldId }: PickerPopoverProps) {
  const { state, dispatch } = useSearchCard();
  const title = usePickerTitle();
  const [anchor] = useState(() => ({ current: document.getElementById(fieldDomId(fieldId)) }));

  // Room for the popover under its field: scroll the field up (below the sticky header) when it sits low.
  useEffect(() => {
    const field = anchor.current;
    if (!field) return;
    const { top, bottom } = field.getBoundingClientRect();
    const needed = bottom + PREFERRED_SPACE - window.innerHeight;
    if (needed <= 0) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollBy({
      top: Math.min(needed, top - HEADER_CLEARANCE),
      behavior: reduced ? "auto" : "smooth",
    });
  }, [anchor]);

  const picker = state.picker;
  if (!picker || !anchor.current) return null;

  return (
    <Popover
      open
      onOpenChange={(next) => {
        if (!next) dispatch({ type: "close" });
      }}
    >
      <PopoverAnchor virtualRef={anchor as { current: HTMLElement }} />
      <PopoverContent
        align="start"
        sideOffset={10}
        collisionPadding={16}
        aria-label={title}
        data-search-picker=""
        onInteractOutside={(event) => {
          // A press on the field itself is handled by the field (it toggles), not as an outside click.
          if (event.target instanceof Node && anchor.current?.contains(event.target))
            event.preventDefault();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocusTo(fieldId);
        }}
        className={cn(
          "flex max-h-[min(660px,var(--radix-popover-content-available-height))] max-w-[calc(100vw-32px)] flex-col gap-0 overflow-hidden rounded-[20px] border-0 bg-white p-0 pt-4 shadow-xl ring-1 ring-mist-200",
          WIDTH[picker.key],
        )}
      >
        <p
          aria-hidden="true"
          className="px-4 pb-3 font-display text-[16px] font-bold text-navy-900"
        >
          {title}
        </p>
        <PickerBody title={title} />
      </PopoverContent>
    </Popover>
  );
}

export { PickerPopover };
