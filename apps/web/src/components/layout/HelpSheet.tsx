"use client";

import type { ReactNode, RefObject } from "react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";

type HelpSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The header's help button: focus returns to it when the sheet closes. */
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  labels: { title: string; description: string };
  children: ReactNode;
};

/** Phone and tablet "Need help?" bottom sheet with drag-to-close, loaded on first open (issue 91). */
function HelpSheet({ open, onOpenChange, returnFocusRef, labels, children }: HelpSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="rounded-t-[28px] border-0 bg-white"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocusRef.current?.focus();
        }}
      >
        <DrawerTitle className="sr-only">{labels.title}</DrawerTitle>
        <DrawerDescription className="sr-only">{labels.description}</DrawerDescription>
        <div className="overflow-y-auto px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export { HelpSheet };
