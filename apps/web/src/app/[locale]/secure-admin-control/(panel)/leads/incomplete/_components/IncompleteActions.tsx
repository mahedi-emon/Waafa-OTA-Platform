"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { markIncomplete } from "@/lib/admin/leadActions";

type IncompleteActionsProps = {
  id: string;
  strings: { contacted: string; dismiss: string; done: string; failed: string };
};

/** Contacted or Set aside for one Incomplete request (issue 250); the list refreshes after. */
export function IncompleteActions({ id, strings }: IncompleteActionsProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (type: "contacted" | "dismissed") =>
    start(async () => {
      const result = await markIncomplete(id, type);
      if (result.ok) {
        toast.success(strings.done);
        router.refresh();
      } else toast.error(result.problem.detail ?? strings.failed);
    });
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" disabled={pending} onClick={() => run("contacted")}>
        {strings.contacted}
      </Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => run("dismissed")}>
        {strings.dismiss}
      </Button>
    </div>
  );
}
