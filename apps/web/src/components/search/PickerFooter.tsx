"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useSearchCard } from "./SearchCardContext";

type PickerFooterProps = { summary: string; detail?: string };

/** Picker summary ("2 travellers · Economy") with Done, pinned to the bottom of sheets. */
function PickerFooter({ summary, detail }: PickerFooterProps) {
  const t = useTranslations("Search.pickers");
  const { dispatch } = useSearchCard();
  return (
    <div className="flex items-center justify-between gap-4 border-t border-mist-200 bg-white px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] lg:pb-3">
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold text-ink-900 tabular-nums">{summary}</p>
        {detail ? (
          <p className="truncate text-[13px] text-mist-600 tabular-nums">{detail}</p>
        ) : null}
      </div>
      <Button type="button" onClick={() => dispatch({ type: "close" })} className="min-w-28">
        {t("done")}
      </Button>
    </div>
  );
}

export { PickerFooter };
