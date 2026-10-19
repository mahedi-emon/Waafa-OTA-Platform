"use client";

import { History } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { RelativeTime } from "@/components/admin/RelativeTime";
import type { Draft } from "./drafts";

type DraftBannerProps = {
  draft: Draft;
  /** Someone saved the record after the draft was typed. */
  older: boolean;
  onRestore: () => void;
  onDiscard: () => void;
};

/** "Unsaved changes from 10 min ago are on this device" with Restore and Discard (ADMIN.md §9). */
function DraftBanner({ draft, older, onRestore, onDiscard }: DraftBannerProps) {
  const t = useTranslations("Admin.editor.draft");
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-700/20 bg-sky-50 p-4"
    >
      <div className="flex min-w-0 items-start gap-3">
        <History aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-sky-700" />
        <div className="min-w-0">
          <p className="text-[14.5px] font-semibold text-navy-900">
            {t.rich("found", {
              time: () => <RelativeTime iso={new Date(draft.savedAt).toISOString()} />,
            })}
          </p>
          {older ? <p className="mt-0.5 text-[13.5px] text-warning-800">{t("newer")}</p> : null}
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={onRestore}>
          {t("restore")}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDiscard}>
          {t("discard")}
        </Button>
      </div>
    </div>
  );
}

export { DraftBanner };
