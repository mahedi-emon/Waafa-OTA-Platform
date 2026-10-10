"use client";

import { useTranslations } from "next-intl";
import { formatTaka } from "@waafa/shared";
import { Button } from "@/components/ui/button";
import { openQuery } from "./BookingCard";

type BookingBarProps = { fromPrice: number };

/**
 * Phone booking bar (PackageDetail-m): the from price and "Send query", fixed above the tab bar. `data-bottom-bar`
 * lifts the floating WhatsApp button above it.
 */
function BookingBar({ fromPrice }: BookingBarProps) {
  const t = useTranslations("Packages");
  return (
    <div
      data-bottom-bar=""
      className="fixed inset-x-0 bottom-(--tab-space) z-30 border-t border-mist-200 bg-white/95 px-4 py-2.5 shadow-[0_-12px_28px_-22px_rgb(2_13_57/0.35)] backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
        <p className="min-w-0 leading-tight">
          <span className="block text-[12px] text-mist-600">{t("detail.priceFrom")}</span>
          <span className="font-display text-[18px] font-extrabold text-navy-900 tabular-nums">
            {formatTaka(fromPrice)}
          </span>
          <span className="text-[12px] text-mist-600"> {t("detail.perPersonShort")}</span>
        </p>
        <Button onClick={openQuery} className="shrink-0">
          {t("detail.sendQuery")}
        </Button>
      </div>
    </div>
  );
}

export { BookingBar };
