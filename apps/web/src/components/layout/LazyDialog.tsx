"use client";

import { useRef, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Slot } from "radix-ui";
import { useLazyOverlay } from "./useLazyOverlay";

const LazyDialogContent = dynamic(
  () => import("./LazyDialogContent").then((mod) => mod.LazyDialogContent),
  { ssr: false },
);
const loadDialog = () => import("./LazyDialogContent");

type LazyDialogProps = {
  /** One button element (server-rendered is fine); it opens the dialog. */
  trigger: ReactNode;
  /** Read by screen readers as the dialog's name and description. */
  title: string;
  description: string;
  className?: string;
  children: ReactNode;
};

/**
 * A request dialog whose code (Radix Dialog, focus trap, scroll lock) loads when the browser is idle or on the first
 * press, not with the page (issue 236). Used by the corporate quote and EMI requests.
 */
function LazyDialog({ trigger, title, description, className, children }: LazyDialogProps) {
  const triggerRef = useRef<HTMLElement>(null);
  const dialog = useLazyOverlay(loadDialog);

  return (
    <>
      <Slot.Root
        ref={triggerRef}
        aria-haspopup="dialog"
        aria-expanded={dialog.open}
        onClick={() => dialog.setOpen(true)}
      >
        {trigger}
      </Slot.Root>
      {dialog.mounted ? (
        <LazyDialogContent
          open={dialog.open}
          onOpenChange={dialog.setOpen}
          returnFocusRef={triggerRef}
          title={title}
          description={description}
          {...(className ? { className } : {})}
        >
          {children}
        </LazyDialogContent>
      ) : null}
    </>
  );
}

export { LazyDialog };
