"use client";

import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type RestoreVersionButtonProps = {
  /** The button's words ("Restore this version"). */
  label: string;
  /** The question in the confirm dialog. */
  title: string;
  disabled: boolean;
  /** Why it is disabled (unsaved changes), shown on hover. */
  reason?: string;
  onConfirm: () => void;
};

/** A History restore with its confirm: restoring replaces what's on screen, so it asks once (ADMIN.md §9). */
function RestoreVersionButton({
  label,
  title,
  disabled,
  reason,
  onConfirm,
}: RestoreVersionButtonProps) {
  const t = useTranslations("Admin.editor.history");
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" disabled={disabled} title={reason}>
          <RotateCcw aria-hidden="true" className="size-4" />
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{t("restoreBody")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{t("restoreConfirm")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { RestoreVersionButton };
