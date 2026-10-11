"use client";

import type { MouseEvent, ReactNode, RefObject } from "react";
import { X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";

type MobileMenuSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The menu button: focus returns to it when the drawer closes. */
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  logo: ReactNode;
  body: ReactNode;
  labels: { close: string; title: string; description: string };
};

/** The full-screen phone and tablet drawer itself, loaded on first open (issue 91). */
function MobileMenuSheet({
  open,
  onOpenChange,
  returnFocusRef,
  logo,
  body,
  labels,
}: MobileMenuSheetProps) {
  function closeOnLink(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("a")) onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full max-w-none gap-0 rounded-none border-0 bg-white p-0 data-[side=right]:w-full data-[side=right]:max-w-none data-[side=right]:rounded-none sm:data-[side=right]:max-w-[440px]"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocusRef.current?.focus();
        }}
      >
        <SheetTitle className="sr-only">{labels.title}</SheetTitle>
        <SheetDescription className="sr-only">{labels.description}</SheetDescription>
        <div className="flex h-(--hdr-h) shrink-0 items-center justify-between border-b border-mist-200 px-4">
          {logo}
          <SheetClose
            aria-label={labels.close}
            className="grid size-11 cursor-pointer place-items-center rounded-full text-navy-900 transition-colors duration-150 outline-none hover:bg-mist-50 focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <X aria-hidden="true" className="size-6" />
          </SheetClose>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain" onClickCapture={closeOnLink}>
          {body}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { MobileMenuSheet };
