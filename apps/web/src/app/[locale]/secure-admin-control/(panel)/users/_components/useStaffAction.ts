"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import type { ActionResult } from "@/lib/admin/leadActions";

/** Runs a staff change with a toast, then refreshes the list (Users and roles, D0 R5). */
export function useStaffAction(failed: string) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<ActionResult>, success: string, after?: () => void) =>
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.problem.fields?.[0]?.message ?? result.problem.detail ?? failed);
        return;
      }
      toast.success(success);
      after?.();
      router.refresh();
    });
  return { pending, run };
}
