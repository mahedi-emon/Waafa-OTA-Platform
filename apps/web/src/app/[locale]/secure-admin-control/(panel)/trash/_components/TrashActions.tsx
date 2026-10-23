"use client";

import { useTransition } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { purgeTrashItem, restoreTrashItem } from "@/lib/admin/contentActions";

type TrashActionsProps = {
  id: string;
  title: string;
  /** Delete forever is for the Super Admin only (ADMIN.md §9). */
  canPurge: boolean;
  strings: {
    restore: string;
    restored: string;
    purge: string;
    purgeTitle: string;
    purgeBody: string;
    purgeConfirm: string;
    purged: string;
    cancel: string;
    failed: string;
    open: string;
  };
};

/** Restore puts the record back where it was (live again if it was live); Delete forever cannot be undone. */
function TrashActions({ id, title, canPurge, strings }: TrashActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const restore = () =>
    startTransition(async () => {
      const result = await restoreTrashItem(id);
      if (!result.ok) {
        toast.error(result.problem.detail ?? strings.failed);
        return;
      }
      toast.success(strings.restored.replace("{title}", title), {
        ...(result.href
          ? { action: { label: strings.open, onClick: () => router.push(result.href ?? "") } }
          : {}),
      });
      router.refresh();
    });

  const purge = () =>
    startTransition(async () => {
      const result = await purgeTrashItem(id);
      if (!result.ok) {
        toast.error(result.problem.detail ?? strings.failed);
        return;
      }
      toast.success(strings.purged.replace("{title}", title));
      router.refresh();
    });

  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      <Button type="button" variant="secondary" size="md" loading={pending} onClick={restore}>
        <RotateCcw aria-hidden="true" className="size-4" />
        {strings.restore}
      </Button>
      {canPurge ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={pending}
              className="text-danger-700"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              {strings.purge}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{strings.purgeTitle.replace("{title}", title)}</AlertDialogTitle>
              <AlertDialogDescription>{strings.purgeBody}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{strings.cancel}</AlertDialogCancel>
              <AlertDialogAction variant="danger" onClick={purge}>
                {strings.purgeConfirm}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}

export { TrashActions };
