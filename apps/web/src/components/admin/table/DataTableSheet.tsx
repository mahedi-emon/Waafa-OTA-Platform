"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import { RowChips } from "./RowChips";
import { RowThumbnail } from "./RowThumbnail";
import type { DataRow } from "./types";

type DataTableSheetProps = {
  row: DataRow | null;
  onOpenChange: (open: boolean) => void;
  openLabel: string;
};

/** A row's summary and actions (ADMIN.md §10): what it is, its status and why, and the way into the full page. */
function DataTableSheet({ row, onOpenChange, openLabel }: DataTableSheetProps) {
  const t = useTranslations("Admin.table");
  return (
    <Sheet open={row !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 sm:max-w-md"
        // Focus the sheet itself, not its first chip (whose tooltip would open on its own).
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement).focus();
        }}
      >
        {row ? (
          <>
            <SheetHeader className="gap-3 border-b border-mist-100 px-6 pt-6 pb-4">
              <div className="flex items-start gap-3 pr-8">
                <RowThumbnail thumb={row.thumb} name={row.title} />
                <div className="min-w-0">
                  <SheetTitle className="text-[18px] leading-snug break-words">
                    {row.title}
                  </SheetTitle>
                  {row.subtitle ? (
                    <SheetDescription className="mt-0.5">{row.subtitle}</SheetDescription>
                  ) : (
                    <SheetDescription className="sr-only">{t("summary")}</SheetDescription>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <RowChips chips={row.chips} focusable size="md" />
                {row.sample ? <Badge variant="outline">{t("sample")}</Badge> : null}
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {row.summary && row.summary.length > 0 ? (
                <dl className="flex flex-col gap-3 text-[14.5px]">
                  {row.summary.map((item) => (
                    <div key={item.label}>
                      <dt className="text-[12.5px] font-semibold text-mist-600">{item.label}</dt>
                      <dd className="break-words text-ink-900">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {row.actions ? <div className="mt-5 flex flex-col gap-2">{row.actions}</div> : null}
            </div>
            {row.href ? (
              <SheetFooter className="border-t border-mist-100 px-6 py-4">
                <Button asChild size="md" className="w-full">
                  <Link href={row.href} prefetch={false}>
                    {openLabel}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              </SheetFooter>
            ) : null}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export { DataTableSheet };
