"use client";

import { useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import type { ActionResult } from "@/lib/admin/leadActions";

type ActionButtonProps = {
  /** A server action already bound to its arguments. */
  action: () => Promise<ActionResult>;
  children: ReactNode;
  success: string;
  failed: string;
  /** Asked with the browser's confirm dialog first (deletes, removals). */
  confirm?: string;
  variant?: "primary" | "secondary" | "navy" | "soft" | "ghost" | "danger";
  size?: "sm" | "md";
};

/** One-click admin action (approve, reject, verify, remove): runs the server action, toasts, refreshes the page. */
function ActionButton({
  action,
  children,
  success,
  failed,
  confirm,
  variant = "secondary",
  size = "sm",
}: ActionButtonProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function run() {
    if (confirm && !window.confirm(confirm)) return;
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.problem.detail ?? result.problem.fields?.[0]?.message ?? failed);
        return;
      }
      toast.success(success);
      router.refresh();
    });
  }

  return (
    <Button type="button" variant={variant} size={size} loading={pending} onClick={run}>
      {children}
    </Button>
  );
}

export { ActionButton };
