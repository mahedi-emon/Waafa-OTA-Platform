"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import type { BookingStatus, BookingView } from "@waafa/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateBooking } from "@/lib/admin/bookingActions";

type BookingEditorProps = {
  booking: BookingView;
  statuses: Array<{ value: BookingStatus; label: string }>;
  labels: {
    details: string;
    status: string;
    pnr: string;
    tickets: string;
    ticketsHint: string;
    supplier: string;
    supplierHint: string;
    travelDate: string;
    amount: string;
    paidAmount: string;
    refunded: string;
    refundedHint: string;
    notes: string;
    save: string;
    saved: string;
    failed: string;
  };
};

const digits = (value: string) => Number(value.replace(/[^\d]/g, "") || 0);

/**
 * The booking's editable record (issue 242): status, PNR, ticket numbers, supplier, travel date, amount, what was
 * paid, Refunded and notes. The payment status follows the amounts on the server.
 */
function BookingEditor({ booking, statuses, labels }: BookingEditorProps) {
  const id = useId();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [refunded, setRefunded] = useState(booking.paymentStatus === "refunded");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim();
    const input = {
      status: text("status") as BookingStatus,
      pnr: text("pnr") || null,
      tickets: text("tickets")
        .split(/[\s,]+/)
        .map((ticket) => ticket.trim())
        .filter(Boolean),
      supplier: text("supplier") || null,
      travelDate: text("travelDate") || null,
      amount: digits(text("amount")),
      paid: digits(text("paid")),
      refunded,
      notes: text("notes") || null,
    };
    startTransition(async () => {
      const result = await updateBooking(booking.id, input);
      if (!result.ok) {
        setErrors(
          Object.fromEntries(
            (result.problem.fields ?? []).map((field) => [field.path, field.message]),
          ),
        );
        toast.error(result.problem.detail ?? labels.failed);
        return;
      }
      setErrors({});
      toast.success(labels.saved);
    });
  }

  const field = (name: string) => ({
    id: `${id}-${name}`,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${id}-${name}-error` : undefined,
  });
  const error = (name: string) =>
    errors[name] ? (
      <p id={`${id}-${name}-error`} className="text-sm text-danger-700">
        {errors[name]}
      </p>
    ) : null;

  return (
    <form
      onSubmit={submit}
      aria-labelledby={`${id}-title`}
      className="flex min-w-0 flex-col gap-4 rounded-2xl border border-mist-200 bg-white p-5"
    >
      <h2 id={`${id}-title`} className="font-display text-lg font-bold text-navy-900">
        {labels.details}
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor={`${id}-status`}>{labels.status}</Label>
          <select
            {...field("status")}
            defaultValue={booking.status}
            className="h-11 rounded-xl border border-mist-300 bg-white px-3 text-[15px]"
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor={`${id}-pnr`}>{labels.pnr}</Label>
          <Input
            {...field("pnr")}
            defaultValue={booking.pnr ?? ""}
            autoComplete="off"
            className="uppercase"
          />
          {error("pnr")}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5 md:col-span-2">
          <Label htmlFor={`${id}-tickets`}>{labels.tickets}</Label>
          <Textarea
            {...field("tickets")}
            defaultValue={booking.tickets.join("\n")}
            rows={3}
            aria-describedby={`${id}-tickets-hint`}
          />
          <p id={`${id}-tickets-hint`} className="text-sm text-mist-600">
            {labels.ticketsHint}
          </p>
          {error("tickets.0")}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor={`${id}-supplier`}>{labels.supplier}</Label>
          <Input
            {...field("supplier")}
            defaultValue={booking.supplier ?? ""}
            aria-describedby={`${id}-supplier-hint`}
          />
          <p id={`${id}-supplier-hint`} className="text-sm text-mist-600">
            {labels.supplierHint}
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor={`${id}-travelDate`}>{labels.travelDate}</Label>
          <Input {...field("travelDate")} type="date" defaultValue={booking.travelDate ?? ""} />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor={`${id}-amount`}>{labels.amount}</Label>
          <Input
            {...field("amount")}
            inputMode="numeric"
            defaultValue={String(booking.amount)}
            className="tabular-nums"
          />
          {error("amount")}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor={`${id}-paid`}>{labels.paidAmount}</Label>
          <Input
            {...field("paid")}
            inputMode="numeric"
            defaultValue={String(booking.paid)}
            className="tabular-nums"
          />
          {error("paid")}
        </div>
        <div className="flex items-start gap-3 md:col-span-2">
          <Checkbox
            id={`${id}-refunded`}
            checked={refunded}
            onCheckedChange={(value) => setRefunded(value === true)}
            aria-describedby={`${id}-refunded-hint`}
          />
          <div className="min-w-0">
            <Label htmlFor={`${id}-refunded`}>{labels.refunded}</Label>
            <p id={`${id}-refunded-hint`} className="text-sm text-mist-600">
              {labels.refundedHint}
            </p>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-1.5 md:col-span-2">
          <Label htmlFor={`${id}-notes`}>{labels.notes}</Label>
          <Textarea {...field("notes")} defaultValue={booking.notes ?? ""} rows={3} />
        </div>
      </div>
      <div>
        <Button type="submit" loading={pending}>
          {labels.save}
        </Button>
      </div>
    </form>
  );
}

export { BookingEditor };
