"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";

type TabBarMoreSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Server-rendered More sheet body (grid + call and WhatsApp buttons). */
  children: ReactNode;
  labels: { title: string; description: string; close: string };
};

/** The tab bar's More bottom sheet with drag-to-close, loaded on first open (issue 91). */
function TabBarMoreSheet({ open, onOpenChange, children, labels }: TabBarMoreSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="rounded-t-[28px] border-0 bg-white data-[vaul-drawer-direction=bottom]:bottom-(--tab-space) lg:hidden">
        <div className="flex items-center justify-between px-5 pt-2">
          <DrawerTitle className="font-display text-[20px] font-bold text-navy-900">
            {labels.title}
          </DrawerTitle>
          <DrawerClose
            aria-label={labels.close}
            className="grid size-11 cursor-pointer place-items-center rounded-full text-navy-900 outline-none hover:bg-mist-50 focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <X aria-hidden="true" className="size-6" />
          </DrawerClose>
        </div>
        <DrawerDescription className="sr-only">{labels.description}</DrawerDescription>
        <div
          className="overflow-y-auto px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))]"
          onClickCapture={(event) => {
            if ((event.target as HTMLElement).closest("a[href^='/']")) onOpenChange(false);
          }}
        >
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export { TabBarMoreSheet };
