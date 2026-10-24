import { ArrowLeft } from "lucide-react";
import { cn } from "cn";
import { RowChips } from "@/components/admin/table/RowChips";
import type { ChipView } from "@/components/admin/table/types";
import { Link } from "@/i18n/navigation";
import { ScrollToCurrent } from "./ScrollToCurrent";

export type InboxPaneItem = {
  id: string;
  href: string;
  title: string;
  /** Reference and service: "VIS-261024-0003 · Visa". */
  subtitle: string;
  chips: ChipView[];
  /** A short right-hand fact: age or total. */
  meta?: string;
};

type InboxListPaneProps = {
  /** "Leads", "Visa applications", "Orders". */
  title: string;
  /** The full list with the same filters. */
  allHref: string;
  allLabel: string;
  /** "25 of 312". */
  count: string;
  items: InboxPaneItem[];
  activeId: string;
  empty: string;
};

/**
 * The queue beside a work item on wide screens (ADMIN.md §5.5): the list the person came from, with the open item
 * marked, so the next one is one click away. Rendered on the server from the same page of the list.
 */
function InboxListPane({
  title,
  allHref,
  allLabel,
  count,
  items,
  activeId,
  empty,
}: InboxListPaneProps) {
  return (
    <nav
      aria-label={title}
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-mist-200 bg-white"
    >
      <div className="flex items-center justify-between gap-2 border-b border-mist-100 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-display text-[15px] font-bold text-navy-900">{title}</p>
          <p className="text-[12.5px] text-mist-600 tabular-nums">{count}</p>
        </div>
        <Link
          href={allHref}
          prefetch={false}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13.5px] font-semibold text-brand-700 hover:bg-electric-50 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {allLabel}
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-8 text-center text-[14px] text-mist-600">{empty}</p>
      ) : (
        <ul
          id="inbox-queue"
          className="min-h-0 flex-1 divide-y divide-mist-100 overflow-y-auto overscroll-contain"
        >
          {items.map((item) => {
            const active = item.id === activeId;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  prefetch={false}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-16 flex-col gap-1 px-4 py-3 transition-colors duration-150 focus-visible:bg-electric-50 focus-visible:outline-none",
                    active
                      ? "bg-electric-50 shadow-[inset_3px_0_0_var(--color-electric-600)]"
                      : "hover:bg-mist-50",
                  )}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-semibold text-navy-900">{item.title}</span>
                    {item.meta ? (
                      <span className="shrink-0 text-[12.5px] text-mist-600 tabular-nums">
                        {item.meta}
                      </span>
                    ) : null}
                  </span>
                  <span className="truncate text-[13px] text-mist-600">{item.subtitle}</span>
                  {item.chips.length > 0 ? <RowChips chips={item.chips} /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <ScrollToCurrent listId="inbox-queue" />
    </nav>
  );
}

export { InboxListPane };
