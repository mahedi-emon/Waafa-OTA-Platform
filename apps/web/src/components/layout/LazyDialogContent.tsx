"use client";

import type { ReactNode, RefObject } from "react";
import { cn } from "cn";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

type LazyDialogContentProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The trigger: focus returns to it when the dialog closes. */
  returnFocusRef: RefObject<HTMLElement | null>;
  title: string;
  description: string;
  className?: string;
  children: ReactNode;
};

/** The dialog itself for LazyDialog, loaded on first open or when the browser is idle (issue 236). */
function LazyDialogContent({
  open,
  onOpenChange,
  returnFocusRef,
  title,
  description,
  className,
  children,
}: LazyDialogContentProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[92dvh] max-w-[min(640px,calc(100vw-24px))] overflow-y-auto p-0",
          className,
        )}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocusRef.current?.focus();
        }}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export { LazyDialogContent };
