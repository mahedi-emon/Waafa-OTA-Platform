"use client";

import { useTransition } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { moveRecord } from "@/lib/admin/contentActions";

type RecordMoveButtonsProps = {
  contentKey: string;
  id: string;
  strings: { earlier: string; later: string; moved: string; failed: string };
};

/** Moves a record a place earlier or later in the order the site shows (the DataTable row action, D0 R5). */
function RecordMoveButtons({ contentKey, id, strings }: RecordMoveButtonsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const move = (by: -1 | 1) =>
    startTransition(async () => {
      const result = await moveRecord(contentKey, id, by);
      if (!result.ok) {
        toast.error(strings.failed);
        return;
      }
      toast.success(strings.moved);
      router.refresh();
    });
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="secondary"
        size="md"
        disabled={pending}
        onClick={() => move(-1)}
      >
        <ArrowUp aria-hidden="true" className="size-4" />
        {strings.earlier}
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="md"
        disabled={pending}
        onClick={() => move(1)}
      >
        <ArrowDown aria-hidden="true" className="size-4" />
        {strings.later}
      </Button>
    </div>
  );
}

export { RecordMoveButtons };
