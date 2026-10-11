"use client";

import type { ReactNode, RefObject } from "react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";

type HelpPopoverProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The header's help button: the popover sits under it and focus returns to it on close. */
  anchorRef: RefObject<HTMLButtonElement | null>;
  label: string;
  children: ReactNode;
};

/** Desktop "Need help?" popover under the header button, loaded on first open (issue 91). */
function HelpPopover({ open, onOpenChange, anchorRef, label, children }: HelpPopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor virtualRef={anchorRef as RefObject<HTMLButtonElement>} />
      <PopoverContent
        align="end"
        sideOffset={12}
        aria-label={label}
        className="w-[360px] rounded-[20px] border-0 bg-white p-3 shadow-xl ring-1 ring-mist-200"
        // The button toggles the popover itself, so a press on it is not an outside click.
        onInteractOutside={(event) => {
          if (anchorRef.current?.contains(event.target as Node)) event.preventDefault();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          anchorRef.current?.focus();
        }}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

export { HelpPopover };
