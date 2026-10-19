"use client";

import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RelativeTime } from "@/components/admin/RelativeTime";
import type { CurrentVersion } from "@/lib/admin/blueprints/problems";

type ConflictDialogProps = {
  open: boolean;
  current: CurrentVersion | null;
  onReload: () => void;
  onKeep: () => void;
};

/**
 * Someone saved first: "Rafi saved this 2 min ago", with See their version (this person's work stays on the
 * device) or Save mine over theirs. Never a silent overwrite (ADMIN.md §9).
 */
function ConflictDialog({ open, current, onReload, onKeep }: ConflictDialogProps) {
  const t = useTranslations("Admin.editor.conflict");
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t.rich("title", {
              name: current?.updatedBy ?? t("someone"),
              time: () => (current ? <RelativeTime iso={current.updatedAt} /> : null),
            })}
          </AlertDialogTitle>
          <AlertDialogDescription>{t("body")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button type="button" variant="secondary" onClick={onKeep}>
            {t("keep")}
          </Button>
          <Button type="button" onClick={onReload}>
            {t("reload")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { ConflictDialog };
