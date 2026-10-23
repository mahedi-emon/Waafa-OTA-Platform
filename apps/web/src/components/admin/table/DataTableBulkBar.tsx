"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import type { BulkAction } from "./types";

type DataTableBulkBarProps = {
  ids: string[];
  actions: BulkAction[];
  onDone: () => void;
  onExport: () => void;
};

/** What to do with the selected rows (ADMIN.md §10): the list's own actions, export, and a confirm for risky ones. */
function DataTableBulkBar({ ids, actions, onDone, onExport }: DataTableBulkBarProps) {
  const t = useTranslations("Admin.table");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [asking, setAsking] = useState<BulkAction | null>(null);
  const [choice, setChoice] = useState<Record<string, string>>({});

  const run = (action: BulkAction) =>
    startTransition(async () => {
      const result = await action.run(ids, choice[action.id]);
      if (!result.ok) {
        toast.error(result.message ?? t("failed"));
        return;
      }
      toast.success(result.message ?? t("done", { count: result.changed ?? ids.length }));
      onDone();
      router.refresh();
    });

  return (
    <div
      role="region"
      aria-label={t("selected", { count: ids.length })}
      className="sticky top-16 z-20 flex flex-col gap-3 border-b border-electric-200 bg-electric-50 px-4 py-3 md:flex-row md:items-center"
    >
      <p className="font-semibold text-navy-900" aria-live="polite">
        {t("selected", { count: ids.length })}
      </p>
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {actions.map((action) =>
          action.choices ? (
            <span key={action.id} className="flex items-center gap-2">
              <select
                aria-label={action.choices.label}
                value={choice[action.id] ?? ""}
                onChange={(event) => setChoice({ ...choice, [action.id]: event.target.value })}
                className="h-11 rounded-xl border border-mist-300 bg-white px-3 text-[14.5px]"
              >
                <option value="">{action.choices.label}</option>
                {action.choices.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                size="sm"
                loading={pending}
                disabled={!choice[action.id]}
                onClick={() => run(action)}
              >
                {action.label}
              </Button>
            </span>
          ) : (
            <Button
              key={action.id}
              type="button"
              size="sm"
              variant={action.danger ? "ghost" : "secondary"}
              disabled={pending}
              className={action.danger ? "text-danger-700" : undefined}
              onClick={() => (action.confirm ? setAsking(action) : run(action))}
            >
              {action.label}
            </Button>
          ),
        )}
        <Button type="button" size="sm" variant="secondary" onClick={onExport}>
          {t("exportSelected")}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          {t("clearSelection")}
        </Button>
      </div>
      <AlertDialog open={asking !== null} onOpenChange={(open) => (open ? null : setAsking(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {asking?.confirm?.replace("{count}", String(ids.length)) ?? ""}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("confirmBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant={asking?.danger ? "danger" : undefined}
              onClick={() => {
                if (asking) run(asking);
                setAsking(null);
              }}
            >
              {asking?.label ?? ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export { DataTableBulkBar };
