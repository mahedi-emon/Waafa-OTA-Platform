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

type LeaveDialogProps = { open: boolean; onStay: () => void; onLeave: () => void };

/** The unsaved-changes guard's question; leaving keeps the work on this device (ADMIN.md §9). */
function LeaveDialog({ open, onStay, onLeave }: LeaveDialogProps) {
  const t = useTranslations("Admin.editor.leave");
  return (
    <AlertDialog open={open} onOpenChange={(next) => (next ? null : onStay())}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("body")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button type="button" variant="secondary" onClick={onLeave}>
            {t("leave")}
          </Button>
          <Button type="button" onClick={onStay}>
            {t("stay")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { LeaveDialog };
