"use client";

import { useId, useState, useTransition } from "react";
import { BadgeCheck, CircleX } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import { proofAction } from "@/lib/admin/opsActions";

type ProofDecisionProps = { id: string; reference: string };

/**
 * Verify or Reject a payment proof (ADMIN.md §8.5): Verify marks the order paid and confirms it; Reject asks why
 * and tells the customer. A decided proof stays decided.
 */
function ProofDecision({ id, reference }: ProofDecisionProps) {
  const t = useTranslations("Admin.proofDecision");
  const router = useRouter();
  const uid = useId();
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function run(input: { type: "verify" } | { type: "reject"; reason: string }) {
    startTransition(async () => {
      const result = await proofAction(id, input);
      if (!result.ok) {
        const message = result.problem.fields?.[0]?.message ?? result.problem.detail ?? t("failed");
        setError(message);
        toast.error(message);
        return;
      }
      toast.success(t(input.type === "verify" ? "verified" : "rejected", { reference }));
      setRejecting(false);
      router.refresh();
    });
  }

  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      <Button
        type="button"
        size="md"
        loading={pending && !rejecting}
        disabled={pending}
        onClick={() => run({ type: "verify" })}
      >
        <BadgeCheck aria-hidden="true" className="size-4" />
        {t("verify")}
      </Button>
      <Button
        type="button"
        size="md"
        variant="ghost"
        disabled={pending}
        onClick={() => {
          setReason("");
          setError(null);
          setRejecting(true);
        }}
        className="text-danger-700"
      >
        <CircleX aria-hidden="true" className="size-4" />
        {t("reject")}
      </Button>
      {error && !rejecting ? (
        <p role="alert" className="w-full text-[13.5px] font-medium text-danger-700">
          {error}
        </p>
      ) : null}
      <Dialog open={rejecting} onOpenChange={setRejecting}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("rejectTitle", { reference })}</DialogTitle>
            <DialogDescription>{t("rejectBody")}</DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (reason.trim().length < 3) {
                setError(t("reasonNeeded"));
                return;
              }
              run({ type: "reject", reason: reason.trim() });
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-reason`}>{t("reason")}</Label>
              <Textarea
                id={`${uid}-reason`}
                value={reason}
                rows={3}
                maxLength={300}
                onChange={(event) => setReason(event.target.value)}
                aria-describedby={`${uid}-reason-help`}
                aria-invalid={error ? true : undefined}
              />
              <p id={`${uid}-reason-help`} className="text-[13px] text-mist-600">
                {t("reasonHelp")}
              </p>
            </div>
            {error ? (
              <p role="alert" className="text-[13.5px] font-medium text-danger-700">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setRejecting(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" variant="danger" loading={pending}>
                {t("rejectConfirm")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { ProofDecision };
