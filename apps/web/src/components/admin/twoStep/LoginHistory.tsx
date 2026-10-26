import { CircleAlert, CircleCheck, LockKeyhole } from "lucide-react";
import type { StaffLoginEvent, StaffLoginResult } from "@waafa/shared";
import { cn } from "cn";
import { formatDhakaDateTime } from "@/lib/admin/format";

type LoginHistoryProps = {
  events: StaffLoginEvent[];
  resultLabels: Record<StaffLoginResult, string>;
  newDeviceLabel: string;
  emptyLabel: string;
  className?: string;
};

const GOOD: ReadonlySet<StaffLoginResult> = new Set(["success", "recovery-code"]);

/**
 * Recent sign-ins (issue 234): when, the result in words, the device and the address, newest first; a new device is
 * marked. Used in My account and in the Users sheet.
 */
function LoginHistory({
  events,
  resultLabels,
  newDeviceLabel,
  emptyLabel,
  className,
}: LoginHistoryProps) {
  if (events.length === 0) {
    return <p className={cn("text-[14px] text-mist-600", className)}>{emptyLabel}</p>;
  }
  return (
    <ul className={cn("flex flex-col divide-y divide-mist-100", className)}>
      {events.map((event) => {
        const good = GOOD.has(event.result);
        const Icon = good ? CircleCheck : event.result === "locked" ? LockKeyhole : CircleAlert;
        return (
          <li key={event.id} className="flex gap-3 py-2.5">
            <Icon
              aria-hidden="true"
              className={cn(
                "mt-0.5 size-[18px] shrink-0",
                good
                  ? "text-success-600"
                  : event.result === "locked"
                    ? "text-warning-700"
                    : "text-danger-600",
              )}
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="flex flex-wrap items-center gap-x-2 text-[14px] font-semibold text-ink-900">
                {resultLabels[event.result]}
                {event.newDevice ? (
                  <span className="rounded-full bg-warning-50 px-2 py-0.5 text-[12px] font-semibold text-warning-700">
                    {newDeviceLabel}
                  </span>
                ) : null}
              </p>
              <p className="text-[13px] break-words text-mist-600 tabular-nums">
                {[formatDhakaDateTime(event.at), event.device, event.address]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export { LoginHistory };
