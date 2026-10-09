"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "cn";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type MobileMenuProps = {
  /** Server-rendered LogoLockup (no tagline). */
  logo: ReactNode;
  /** Server-rendered drawer body: main links, the More grid and the contact block. */
  body: ReactNode;
  labels: { open: string; close: string; title: string; description: string };
  className?: string;
};

/**
 * Full-screen phone and tablet drawer (Home-m-drawer board). It slides in from the right with the sheet spring's
 * timing, locks scroll, returns focus to the menu button and closes itself when a link inside is followed.
 */
function MobileMenu({ logo, body, labels, className }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  function closeOnLink(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("a")) setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label={labels.open}
        className={cn(
          "grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-navy-900 transition-colors duration-150 outline-none hover:bg-mist-50 focus-visible:ring-3 focus-visible:ring-ring/40",
          className,
        )}
      >
        <Menu aria-hidden="true" className="size-6" />
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full max-w-none gap-0 rounded-none border-0 bg-white p-0 data-[side=right]:w-full data-[side=right]:max-w-none data-[side=right]:rounded-none sm:data-[side=right]:max-w-[440px]"
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

export { MobileMenu };
