"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { cn } from "cn";
import { popoverFieldId, useSearchCard } from "./SearchCardContext";

const PickerPopover = dynamic(() => import("./PickerPopover").then((mod) => mod.PickerPopover), {
  ssr: false,
});

type PickerAnchorProps = { fieldId: string; className?: string; children: ReactNode };

/**
 * Wraps a field that opens a picker. From 1024 px the picker opens as a popover under the field; below that the
 * card's PickerSheet shows the same body instead.
 */
function PickerAnchor({ fieldId, className, children }: PickerAnchorProps) {
  const { state, isDesktop } = useSearchCard();
  const multi = state.tab === "flight" && state.flight.trip === "multi-city";
  const open =
    isDesktop && state.picker !== null && popoverFieldId(state.picker, multi) === fieldId;

  return (
    <div className={cn("min-w-0", className)}>
      {children}
      {open ? <PickerPopover fieldId={fieldId} /> : null}
    </div>
  );
}

export { PickerAnchor };
