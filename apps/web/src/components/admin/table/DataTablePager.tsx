"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAGE_SIZES, pageRange } from "./listQuery";
import type { ListPage } from "./types";

type DataTablePagerProps = {
  page: ListPage;
  pending: boolean;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
};

/** "1–25 of 312", page size 25 / 50 / 100, previous and next (server pages). */
function DataTablePager({ page, pending, onPage, onPageSize }: DataTablePagerProps) {
  const t = useTranslations("Admin.table");
  const range = pageRange(page.page, page.pageSize, page.total);
  // An empty list has nothing to count or page through (no "0 to 0 of 0").
  if (page.total === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-mist-100 px-4 py-3">
      <p className="text-[13.5px] text-mist-700 tabular-nums" aria-live="polite">
        {t("range", { from: range.from, to: range.to, total: page.total })}
      </p>
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="hidden text-[13.5px] text-mist-600 sm:inline">
          {t("pageSize")}
        </span>
        <Select value={String(page.pageSize)} onValueChange={(value) => onPageSize(Number(value))}>
          <SelectTrigger aria-label={t("pageSize")} className="h-11 w-20 tabular-nums">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={t("previous")}
          disabled={pending || page.page <= 1}
          onClick={() => onPage(page.page - 1)}
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={t("next")}
          disabled={pending || page.page >= range.pages}
          onClick={() => onPage(page.page + 1)}
        >
          <ChevronRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export { DataTablePager };
