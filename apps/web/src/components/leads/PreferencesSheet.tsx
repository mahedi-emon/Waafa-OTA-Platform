"use client";

import { useRef, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { SlidersHorizontal } from "lucide-react";
import { useLazyOverlay } from "@/components/layout/useLazyOverlay";
import { Button } from "@/components/ui/button";

const PreferencesDrawer = dynamic(
  () => import("./PreferencesDrawer").then((mod) => mod.PreferencesDrawer),
  { ssr: false },
);
const loadPreferencesDrawer = () => import("./PreferencesDrawer");

type PreferencesSheetProps = {
  /** Button words, e.g. "Preferences (2)". */
  trigger: string;
  labels: { title: string; lead: string; clear: string; save: string };
  onClear: () => void;
  children: ReactNode;
};

/**
 * The preferences button below 1280 px (flights and hotels Manual mode). The bottom sheet's code (vaul and the dialog
 * primitives) loads when the browser is idle or on the first press, not with the page (issue 236).
 */
function PreferencesSheet({ trigger, labels, onClear, children }: PreferencesSheetProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const sheet = useLazyOverlay(loadPreferencesDrawer);

  return (
    <>
      <Button
        ref={buttonRef}
        variant="secondary"
        aria-haspopup="dialog"
        aria-expanded={sheet.open}
        onClick={() => sheet.setOpen(true)}
        className="self-start xl:hidden"
      >
        <SlidersHorizontal aria-hidden="true" />
        {trigger}
      </Button>
      {sheet.mounted ? (
        <PreferencesDrawer
          open={sheet.open}
          onOpenChange={sheet.setOpen}
          returnFocusRef={buttonRef}
          labels={labels}
          onClear={onClear}
        >
          {children}
        </PreferencesDrawer>
      ) : null}
    </>
  );
}

export { PreferencesSheet };
