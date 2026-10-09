"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import { CircleAlertIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

type WaafaToasterProps = ToasterProps & {
  /** Public pages on phones keep toasts above the bottom tab bar (States board). Admin passes false. */
  aboveTabBar?: boolean;
};

/**
 * Toasts (States board): success is navy with a white tick, errors are white with a danger edge and stay until
 * closed, info is white. Bottom-right on desktop, full width above the tab bar on phones. Light theme only.
 */
function Toaster({ aboveTabBar = true, ...props }: WaafaToasterProps) {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      offset={24}
      mobileOffset={{
        bottom: aboveTabBar ? "calc(var(--tab-h) + env(safe-area-inset-bottom) + 12px)" : 16,
        left: 16,
        right: 16,
      }}
      gap={10}
      visibleToasts={3}
      icons={{
        success: <CircleCheckIcon className="size-5" />,
        info: <InfoIcon className="size-5" />,
        warning: <TriangleAlertIcon className="size-5" />,
        error: <CircleAlertIcon className="size-5" />,
        loading: <Spinner />,
      }}
      toastOptions={{
        unstyled: true,
        duration: 3000,
        classNames: {
          toast:
            "group/toast flex w-full items-center gap-3 rounded-lg border border-mist-200 bg-white px-4 py-3.5 text-mist-800 shadow-lg sm:w-[380px]",
          title: "text-[15px] font-semibold text-navy-900",
          description: "text-sm leading-snug text-mist-600",
          content: "flex flex-1 flex-col gap-0.5",
          icon: "shrink-0 text-electric-600",
          actionButton:
            "ml-auto shrink-0 cursor-pointer rounded-sm text-sm font-semibold text-navy-900 underline underline-offset-4",
          cancelButton: "ml-1 shrink-0 cursor-pointer rounded-sm text-sm font-medium text-mist-600",
          closeButton: "border-mist-200 bg-white text-mist-600",
          success:
            "border-navy-900 bg-navy-900 text-white [&_[data-title]]:text-white [&_[data-description]]:text-white/80 [&_[data-icon]]:text-cyan-400 [&_[data-button]]:text-white",
          error: "border-danger-600/45 [&_[data-icon]]:text-danger-600",
          warning: "border-warning-700/30 bg-warning-50 [&_[data-icon]]:text-warning-700",
          info: "[&_[data-icon]]:text-electric-600",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
