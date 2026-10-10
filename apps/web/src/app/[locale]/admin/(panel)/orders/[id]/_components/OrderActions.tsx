"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { OrderStatus } from "@waafa/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { updateOrder } from "@/lib/admin/opsActions";

type OrderActionsProps = {
  id: string;
  next: Array<{ value: OrderStatus; label: string }>;
  paymentVerified: boolean;
  canMove: boolean;
  strings: {
    moveTo: string;
    courier: string;
    tracking: string;
    note: string;
    update: string;
    updated: string;
    failed: string;
    markVerified: string;
    markNotVerified: string;
    final: string;
  };
};

/** The order drawer actions (AdminOrders-open board): move along the workflow, ship with tracking, verify payment. */
function OrderActions({ id, next, paymentVerified, canMove, strings }: OrderActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [courier, setCourier] = useState("");
  const [tracking, setTracking] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function run(input: Parameters<typeof updateOrder>[1]) {
    setError(null);
    startTransition(async () => {
      const result = await updateOrder(id, input);
      if (!result.ok) {
        const message =
          result.problem.fields?.[0]?.message ?? result.problem.detail ?? strings.failed;
        setError(message);
        toast.error(message);
        return;
      }
      toast.success(strings.updated);
      setStatus("");
      setCourier("");
      setTracking("");
      setNote("");
      router.refresh();
    });
  }

  function submit() {
    if (!status && !note.trim()) return;
    run({
      ...(status ? { status } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(courier.trim() ? { courier: courier.trim() } : {}),
      ...(tracking.trim() ? { trackingNumber: tracking.trim() } : {}),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {canMove && next.length > 0 ? (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="order-status">{strings.moveTo}</Label>
            <select
              id="order-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as OrderStatus | "")}
              className="h-12 rounded-xl border border-mist-300 bg-white px-3 text-[15px]"
            >
              <option value="">{strings.moveTo}</option>
              {next.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {status === "shipped" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="order-courier">{strings.courier}</Label>
                <Input
                  id="order-courier"
                  value={courier}
                  onChange={(event) => setCourier(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="order-tracking">{strings.tracking}</Label>
                <Input
                  id="order-tracking"
                  value={tracking}
                  onChange={(event) => setTracking(event.target.value)}
                />
              </div>
            </div>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="order-note">{strings.note}</Label>
            <Input
              id="order-note"
              value={note}
              maxLength={300}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
          <div>
            <Button size="sm" onClick={submit} loading={pending} disabled={!status && !note.trim()}>
              {strings.update}
            </Button>
          </div>
        </>
      ) : canMove ? (
        <p className="text-[14px] text-mist-600">{strings.final}</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-[13.5px] font-medium text-danger-600">
          {error}
        </p>
      ) : null}
      <div className="border-t border-mist-100 pt-4">
        <Button
          size="sm"
          variant={paymentVerified ? "secondary" : "navy"}
          loading={pending}
          onClick={() => run({ paymentVerified: !paymentVerified })}
        >
          {paymentVerified ? strings.markNotVerified : strings.markVerified}
        </Button>
      </div>
    </div>
  );
}

export { OrderActions };
