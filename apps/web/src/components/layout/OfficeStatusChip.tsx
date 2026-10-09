"use client";

import { cn } from "cn";
import type { OpeningHours } from "@waafa/shared";
import { useOfficeStatus } from "./useOfficeStatus";

type OfficeStatusChipProps = {
  hours: OpeningHours;
  /** Read by screen readers while the status is computed on the client. */
  pendingLabel: string;
  className?: string;
};

/**
 * Live "Open now · until 6 pm" or "Closed · opens Saturday at 10 am" chip (PRD §2). Computed on the client in
 * Asia/Dhaka; the server renders a same-size placeholder so nothing shifts when the status appears.
 */
function OfficeStatusChip({ hours, pendingLabel, className }: OfficeStatusChipProps) {
  const status = useOfficeStatus(hours);

  return (
    <span
      role="status"
      className={cn(
        "inline-flex min-h-7 max-w-full min-w-44 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] leading-snug font-semibold",
        status?.open ? "bg-success-50 text-success-600" : "bg-mist-100 text-ink-900",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          status === null ? "bg-mist-300" : status.open ? "bg-success-600" : "bg-mist-700",
        )}
      />
      {status === null ? <span className="sr-only">{pendingLabel}</span> : status.label}
    </span>
  );
}

export { OfficeStatusChip };
