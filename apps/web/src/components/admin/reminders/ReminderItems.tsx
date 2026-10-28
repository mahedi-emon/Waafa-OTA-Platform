"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { AlarmClock, Check, Trash2 } from "lucide-react";
import type { ReminderView } from "@waafa/shared";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { deleteReminder, updateReminder } from "@/lib/admin/alertActions";
import { formatDhakaDateTime } from "@/lib/admin/format";

export type ReminderStrings = {
  overdue: string;
  today: string;
  later: string;
  done: string;
  snooze: string;
  remove: string;
  failed: string;
  doneToast: string;
  snoozed: string;
  removed: string;
  empty: string;
};

type ReminderItemsProps = {
  items: ReminderView[];
  strings: ReminderStrings;
  /** Show which lead each reminder is about (the dashboard); the lead page leaves it out. */
  showLead?: boolean;
};

const CHIP: Record<ReminderView["when"], string> = {
  overdue: "bg-danger-50 text-danger-700",
  today: "bg-warning-50 text-warning-800",
  later: "bg-mist-100 text-mist-700",
};

/** The signed-in person's reminders (issue 243): when, what, and Done, Snooze an hour, Remove. */
function ReminderItems({ items, strings, showLead = false }: ReminderItemsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (work: () => Promise<{ ok: boolean }>, success: string) =>
    startTransition(async () => {
      const result = await work();
      if (!result.ok) {
        toast.error(strings.failed);
        return;
      }
      toast.success(success);
      router.refresh();
    });

  if (items.length === 0) return <p className="text-[14px] text-mist-600">{strings.empty}</p>;

  return (
    <ul className="flex flex-col divide-y divide-mist-100" aria-busy={pending}>
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="flex flex-wrap items-center gap-2 text-[13px] text-mist-700">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold",
                  CHIP[item.when],
                )}
              >
                <AlarmClock aria-hidden="true" className="size-3.5" />
                {strings[item.when]}
              </span>
              <time dateTime={item.dueAt} className="tabular-nums">
                {formatDhakaDateTime(item.dueAt)}
              </time>
            </p>
            <p className="text-[14.5px] break-words text-ink-900">{item.note}</p>
            {showLead && item.lead ? (
              <Link
                href={`/secure-admin-control/leads/${item.lead.id}`}
                prefetch={false}
                className="w-fit text-[13px] font-semibold text-brand-700 underline-offset-2 hover:underline"
              >
                {item.lead.reference} · {item.lead.name}
              </Link>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              className="min-h-11 sm:min-h-9"
              onClick={() => run(() => updateReminder(item.id, { done: true }), strings.doneToast)}
            >
              <Check aria-hidden="true" className="size-4" />
              {strings.done}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="min-h-11 sm:min-h-9"
              onClick={() =>
                run(
                  () =>
                    updateReminder(item.id, {
                      dueAt: new Date(Date.now() + 60 * 60_000).toISOString(),
                    }),
                  strings.snoozed,
                )
              }
            >
              {strings.snooze}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-11 sm:size-9"
              onClick={() => run(() => deleteReminder(item.id), strings.removed)}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              <span className="sr-only">{strings.remove}</span>
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export { ReminderItems };
