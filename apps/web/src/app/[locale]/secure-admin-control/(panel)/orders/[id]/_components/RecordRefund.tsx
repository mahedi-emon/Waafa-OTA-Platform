"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { recordRefund } from "@/lib/admin/leadActions";

type RecordRefundProps = {
  orderId: string;
  strings: {
    title: string;
    amount: string;
    reference: string;
    referenceHint: string;
    note: string;
    save: string;
    saved: string;
    failed: string;
  };
};

/** Write a refund made in the gateway's or bank's panel on the order (issue 251): amount, its reference, a note. */
export function RecordRefund({ orderId, strings }: RecordRefundProps) {
  const id = useId();
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const valid = /^\d+$/.test(amount) && Number(amount) > 0 && reference.trim().length >= 2;
  return (
    <form
      className="flex flex-col gap-3"
      aria-labelledby={`${id}-title`}
      onSubmit={(event) => {
        event.preventDefault();
        if (!valid) return;
        start(async () => {
          const result = await recordRefund(orderId, {
            amount: Number(amount),
            reference: reference.trim(),
            ...(note.trim() ? { note: note.trim() } : {}),
          });
          if (result.ok) {
            toast.success(strings.saved);
            setAmount("");
            setReference("");
            setNote("");
            router.refresh();
          } else toast.error(result.problem.detail ?? strings.failed);
        });
      }}
    >
      <p id={`${id}-title`} className="text-[12.5px] font-semibold text-mist-600">
        {strings.title}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-amount`}>{strings.amount}</Label>
          <Input
            id={`${id}-amount`}
            inputMode="numeric"
            value={amount}
            onChange={(event) => setAmount(event.target.value.replace(/[^\d]/g, ""))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-reference`}>{strings.reference}</Label>
          <Input
            id={`${id}-reference`}
            value={reference}
            aria-describedby={`${id}-reference-hint`}
            onChange={(event) => setReference(event.target.value)}
          />
          <p id={`${id}-reference-hint`} className="text-[12.5px] text-mist-600">
            {strings.referenceHint}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-note`}>{strings.note}</Label>
        <Input id={`${id}-note`} value={note} onChange={(event) => setNote(event.target.value)} />
      </div>
      <Button
        type="submit"
        size="sm"
        variant="secondary"
        disabled={!valid || pending}
        className="self-start"
      >
        {strings.save}
      </Button>
    </form>
  );
}
