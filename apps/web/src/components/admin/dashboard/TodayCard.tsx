import type { ReactNode } from "react";
import {
  AlarmClock,
  BadgeCheck,
  CircleCheck,
  Inbox,
  MessageSquareText,
  PackageCheck,
  PackageMinus,
  Plane,
  Sparkles,
  Stamp,
  type LucideIcon,
} from "lucide-react";
import type { InboxCountKey } from "@waafa/shared";
import { cn } from "cn";
import { LocalLink as Link } from "@/components/nav/LocalLink";

const ICONS: Record<InboxCountKey, LucideIcon> = {
  newLeads: Inbox,
  overdueLeads: AlarmClock,
  visaWaiting: Stamp,
  ordersToConfirm: PackageCheck,
  proofsToVerify: BadgeCheck,
  feedbackToReview: MessageSquareText,
  reviewsToModerate: MessageSquareText,
  lowStock: PackageMinus,
  groupFaresEnding: Plane,
  sampleLeft: Sparkles,
};

type TodayCardProps = {
  kind: InboxCountKey;
  count: number;
  href: string;
  /** What waits, with its count ("3 new leads"). */
  label: string;
  /** One more line: the longest wait, or the calm "Nothing waiting" at zero. */
  line?: ReactNode;
  /** Red when this kind of work is late (overdue leads). */
  urgent?: boolean;
};

/**
 * One Today card (ADMIN.md §5.2): what waits and how much, linking to exactly that list. Zero shows a quiet tick
 * instead of a number, so a clear day reads as clear.
 */
function TodayCard({ kind, count, href, label, line, urgent = false }: TodayCardProps) {
  const Icon = count === 0 ? CircleCheck : ICONS[kind];
  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        "flex h-full min-h-20 items-start gap-3 rounded-2xl border bg-white p-3.5 transition-colors duration-150 hover:border-electric-200 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none motion-reduce:transition-none sm:p-4",
        urgent && count > 0 ? "border-danger-600/30 bg-danger-25" : "border-mist-200",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          count === 0
            ? "bg-success-50 text-success-700"
            : urgent
              ? "bg-white text-danger-700"
              : "bg-electric-50 text-brand-700",
        )}
      >
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span
          className={cn(
            "font-semibold",
            count === 0 ? "text-mist-700" : urgent ? "text-danger-700" : "text-navy-900",
          )}
        >
          {label}
        </span>
        {line ? <span className="text-[13px] leading-snug text-mist-600">{line}</span> : null}
      </span>
    </Link>
  );
}

export { TodayCard };
