"use client";

import { useState, type ReactNode } from "react";
import { Headset } from "lucide-react";
import { cn } from "cn";
import type { OpeningHours } from "@waafa/shared";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useOfficeStatus } from "./useOfficeStatus";

type HelpMenuProps = {
  /** The server-rendered HelpPanel. */
  panel: ReactNode;
  hours: OpeningHours;
  labels: { button: string; title: string; description: string };
};

/** 44 px round button with the headset and a live status dot (green while the office is open). */
function HelpTriggerFace({ hours }: { hours: OpeningHours }) {
  const status = useOfficeStatus(hours);
  return (
    <>
      <Headset aria-hidden="true" className="size-5" />
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-2 right-2 size-2 rounded-full ring-2 ring-white transition-colors duration-150",
          status?.open ? "bg-success-600" : "bg-mist-400",
        )}
      />
    </>
  );
}

const triggerClass =
  "relative grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-mist-200 bg-white text-brand-700 transition-colors duration-150 hover:border-mist-300 hover:bg-mist-50 data-[state=open]:border-electric-200 data-[state=open]:bg-electric-50 outline-none focus-visible:ring-3 focus-visible:ring-ring/40";

/**
 * "Need help?" (Home-help, Home-m-help): a popover under the header on desktop, a bottom sheet with drag-to-close on
 * phones and tablets. Both show the same server-rendered panel; only one exists in the accessibility tree at a time.
 */
function HelpMenu({ panel, hours, labels }: HelpMenuProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <Popover>
        <PopoverTrigger aria-label={labels.button} className={cn(triggerClass, "hidden lg:grid")}>
          <HelpTriggerFace hours={hours} />
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={12}
          className="w-[360px] rounded-[20px] border-0 bg-white p-3 shadow-xl ring-1 ring-mist-200"
        >
          {panel}
        </PopoverContent>
      </Popover>

      <Drawer open={sheetOpen} onOpenChange={setSheetOpen}>
        <DrawerTrigger aria-label={labels.button} className={cn(triggerClass, "lg:hidden")}>
          <HelpTriggerFace hours={hours} />
        </DrawerTrigger>
        <DrawerContent className="rounded-t-[28px] border-0 bg-white">
          <DrawerTitle className="sr-only">{labels.title}</DrawerTitle>
          <DrawerDescription className="sr-only">{labels.description}</DrawerDescription>
          <div className="overflow-y-auto px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))]">
            {panel}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export { HelpMenu };
