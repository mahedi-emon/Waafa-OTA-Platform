"use client";

import type { ReactNode, Ref } from "react";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import { Link } from "@/i18n/navigation";
import type { BoardColumnData, ColumnState } from "./types";

type LeadBoardColumnProps = {
  column: BoardColumnData;
  state?: ColumnState;
  /** The drop zone, once dragging is ready. */
  innerRef?: Ref<HTMLLIElement>;
  children: ReactNode;
};

/** One stage on the board: its name and count, its cards, and a link to the rest in the list. */
function LeadBoardColumn({ column, state = "idle", innerRef, children }: LeadBoardColumnProps) {
  const t = useTranslations("Admin.leadBoard");
  const count = column.cards.length;
  return (
    <li
      ref={innerRef}
      aria-labelledby={`stage-${column.id}`}
      className={cn(
        "flex w-[min(17.5rem,82vw)] shrink-0 snap-start flex-col gap-2 rounded-2xl border-2 bg-mist-50 p-3 transition-colors duration-150",
        state === "over"
          ? "border-electric-600 bg-electric-50"
          : state === "allowed"
            ? "border-dashed border-electric-200"
            : "border-transparent",
        state === "refused" && "opacity-55",
      )}
    >
      <h2
        id={`stage-${column.id}`}
        className="flex items-center justify-between gap-2 px-1 text-sm font-bold text-navy-900"
      >
        {column.title}
        <span className="rounded-full bg-white px-2 py-0.5 text-[12px] text-mist-700 tabular-nums">
          {column.total}
        </span>
      </h2>
      {count > 0 ? (
        <ul className="flex min-h-24 flex-col gap-2">{children}</ul>
      ) : (
        <p className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-mist-300 px-2 text-center text-[13px] text-mist-600">
          {t("empty")}
        </p>
      )}
      {column.moreHref && column.total > count ? (
        <Link
          href={column.moreHref}
          prefetch={false}
          className="inline-flex min-h-11 items-center px-1 text-[13px] font-semibold text-brand-700 hover:underline"
        >
          {t("more", { count: column.total - count })}
        </Link>
      ) : null}
    </li>
  );
}

export { LeadBoardColumn };
