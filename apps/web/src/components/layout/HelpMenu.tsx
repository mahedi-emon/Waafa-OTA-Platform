"use client";

import { useRef, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Headset } from "lucide-react";
import { cn } from "cn";
import type { OpeningHours } from "@waafa/shared";
import { useLazyOverlay } from "./useLazyOverlay";
import { useOfficeStatus } from "./useOfficeStatus";

const HelpPopover = dynamic(() => import("./HelpPopover").then((mod) => mod.HelpPopover), {
  ssr: false,
});
const HelpSheet = dynamic(() => import("./HelpSheet").then((mod) => mod.HelpSheet), {
  ssr: false,
});
const loadHelpPopover = () => import("./HelpPopover");
const loadHelpSheet = () => import("./HelpSheet");

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
 * The popover and sheet code loads when the browser is idle or on the first press (issue 91).
 */
function HelpMenu({ panel, hours, labels }: HelpMenuProps) {
  const desktopRef = useRef<HTMLButtonElement>(null);
  const phoneRef = useRef<HTMLButtonElement>(null);
  const popover = useLazyOverlay(loadHelpPopover);
  const sheet = useLazyOverlay(loadHelpSheet);

  return (
    <>
      <button
        ref={desktopRef}
        type="button"
        aria-label={labels.button}
        aria-haspopup="dialog"
        aria-expanded={popover.open}
        data-state={popover.open ? "open" : "closed"}
        onClick={() => popover.setOpen(!popover.open)}
        className={cn(triggerClass, "hidden lg:grid")}
      >
        <HelpTriggerFace hours={hours} />
      </button>
      {popover.mounted ? (
        <HelpPopover
          open={popover.open}
          onOpenChange={popover.setOpen}
          anchorRef={desktopRef}
          label={labels.title}
        >
          {panel}
        </HelpPopover>
      ) : null}

      <button
        ref={phoneRef}
        type="button"
        aria-label={labels.button}
        aria-haspopup="dialog"
        aria-expanded={sheet.open}
        data-state={sheet.open ? "open" : "closed"}
        onClick={() => sheet.setOpen(true)}
        className={cn(triggerClass, "lg:hidden")}
      >
        <HelpTriggerFace hours={hours} />
      </button>
      {sheet.mounted ? (
        <HelpSheet
          open={sheet.open}
          onOpenChange={sheet.setOpen}
          returnFocusRef={phoneRef}
          labels={{ title: labels.title, description: labels.description }}
        >
          {panel}
        </HelpSheet>
      ) : null}
    </>
  );
}

export { HelpMenu };
