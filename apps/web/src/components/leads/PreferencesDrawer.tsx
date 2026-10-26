"use client";

import type { ReactNode, RefObject } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";

type PreferencesDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The trigger button: focus returns to it when the drawer closes. */
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  labels: { title: string; lead: string; clear: string; save: string };
  onClear: () => void;
  children: ReactNode;
};

/** The flight and hotel preferences bottom sheet itself, loaded on first open (issue 236). */
function PreferencesDrawer({
  open,
  onOpenChange,
  returnFocusRef,
  labels,
  onClear,
  children,
}: PreferencesDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="max-h-[90dvh] rounded-t-[28px] border-0 bg-white"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocusRef.current?.focus();
        }}
      >
        <div className="px-4 pt-2 pb-2">
          <DrawerTitle className="font-display text-[18px] font-bold text-navy-900">
            {labels.title}
          </DrawerTitle>
          <DrawerDescription className="text-[13.5px] text-mist-600">
            {labels.lead}
          </DrawerDescription>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
        <div className="flex gap-3 border-t border-mist-200 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
          <Button variant="ghost" onClick={onClear}>
            {labels.clear}
          </Button>
          <DrawerClose asChild>
            <Button className="flex-1">{labels.save}</Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export { PreferencesDrawer };
