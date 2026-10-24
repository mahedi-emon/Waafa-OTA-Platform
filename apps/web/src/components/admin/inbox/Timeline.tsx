import {
  AlarmClock,
  ArrowRightLeft,
  BadgeCheck,
  FileCheck2,
  FileText,
  Inbox,
  Mail,
  Phone,
  StickyNote,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { dhakaDay, formatDhakaTime, formatPlainDate } from "@/lib/admin/format";

export type TimelineEntry = {
  id: string;
  /** created, note, status, assign, call, email, whatsapp, converted, quote, visa, overdue… */
  type: string;
  /** The sentence the step wrote ("Replied on WhatsApp · Moved to In progress"). */
  text: string;
  actor: string;
  /** ISO time. */
  at: string;
};

type TimelineProps = {
  entries: TimelineEntry[];
  /** The type in words ("Note", "Call"); unknown types read "Update". */
  typeLabel: (type: string) => string;
  /** Names the list for screen readers. */
  label: string;
};

const ICONS: Record<string, LucideIcon> = {
  created: Inbox,
  note: StickyNote,
  status: ArrowRightLeft,
  assign: UserRoundPlus,
  call: Phone,
  email: Mail,
  converted: BadgeCheck,
  quote: FileText,
  visa: FileCheck2,
  overdue: AlarmClock,
};

/** Contacts with the customer stand out from internal notes and status changes. */
const CONTACT = new Set(["call", "email", "whatsapp"]);

/**
 * A work item's story (ADMIN.md §5.5, after 21st.dev `olewandowski1/timeline-3`): newest first, grouped by the Dhaka
 * day, each step as the sentence it wrote with who did it and when. Built on plain list markup.
 */
function Timeline({ entries, typeLabel, label }: TimelineProps) {
  const days: Array<{ day: string; items: TimelineEntry[] }> = [];
  for (const entry of entries.toSorted((a, b) => b.at.localeCompare(a.at))) {
    const day = dhakaDay(entry.at);
    const group = days.at(-1);
    if (group && group.day === day) group.items.push(entry);
    else days.push({ day, items: [entry] });
  }

  return (
    <ol aria-label={label} className="flex flex-col gap-5">
      {days.map((group) => (
        <li key={group.day}>
          <h3 className="mb-3 text-[12.5px] font-semibold tracking-wide text-mist-600 uppercase">
            <time dateTime={group.day}>{formatPlainDate(group.day)}</time>
          </h3>
          <ol className="relative flex flex-col gap-4 before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-px before:bg-mist-200">
            {group.items.map((entry) => {
              const Icon = ICONS[entry.type];
              return (
                <li key={entry.id} className="relative flex gap-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white",
                      CONTACT.has(entry.type)
                        ? "bg-electric-50 text-brand-700"
                        : entry.type === "overdue"
                          ? "bg-danger-50 text-danger-700"
                          : entry.type === "converted"
                            ? "bg-success-50 text-success-700"
                            : "bg-mist-100 text-mist-700",
                    )}
                  >
                    {entry.type === "whatsapp" ? (
                      <WhatsAppIcon className="size-4" />
                    ) : Icon ? (
                      <Icon className="size-4" />
                    ) : (
                      <ArrowRightLeft className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0 pt-1">
                    <p className="text-[14.5px] whitespace-pre-line text-ink-900">{entry.text}</p>
                    <p className="mt-0.5 text-[13px] text-mist-600">
                      <span className="font-semibold text-navy-900">{entry.actor}</span> ·{" "}
                      {typeLabel(entry.type)} ·{" "}
                      <time dateTime={entry.at} className="tabular-nums">
                        {formatDhakaTime(entry.at)}
                      </time>
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </li>
      ))}
    </ol>
  );
}

export { Timeline };
