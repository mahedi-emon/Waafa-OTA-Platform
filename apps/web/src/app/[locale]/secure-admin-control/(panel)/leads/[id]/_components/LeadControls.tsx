"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { LeadPriority, LeadStatus } from "@waafa/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { updateLead } from "@/lib/admin/leadActions";

type Option = { value: string; label: string };

type LeadControlsProps = {
  id: string;
  status: LeadStatus;
  priority: LeadPriority;
  assigneeId: string | null;
  statuses: Option[];
  priorities: Option[];
  staff: Option[];
  strings: {
    status: string;
    assignee: string;
    priority: string;
    unassigned: string;
    amount: string;
    amountHint: string;
    reason: string;
    reasonHint: string;
    confirm: string;
    cancel: string;
    updated: string;
    failed: string;
  };
};

const selectClass =
  "h-12 w-full cursor-pointer rounded-xl border border-mist-300 bg-white px-3 text-[15px] text-ink-900 focus-visible:border-electric-600 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none disabled:cursor-wait disabled:opacity-70";

/**
 * Status, assignee and priority for one lead (AdminLead, AdminLead-lost boards). Booked asks for the amount; Cancelled
 * and Lost ask for a reason before saving (FR-ADM-LEAD); the rest save at once.
 */
function LeadControls({
  id,
  status,
  priority,
  assigneeId,
  statuses,
  priorities,
  staff,
  strings,
}: LeadControlsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<LeadStatus | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function save(input: Parameters<typeof updateLead>[1]) {
    setError(null);
    startTransition(async () => {
      const result = await updateLead(id, input);
      if (!result.ok) {
        const field = result.problem.fields?.[0]?.message;
        setError(field ?? strings.failed);
        toast.error(field ?? strings.failed);
        return;
      }
      toast.success(strings.updated);
      setDraft(null);
      setAmount("");
      setReason("");
      router.refresh();
    });
  }

  function onStatus(next: LeadStatus) {
    if (next === status) return;
    if (next === "booked" || next === "cancelled" || next === "lost") {
      setDraft(next);
      return;
    }
    save({ status: next });
  }

  function confirm() {
    if (!draft) return;
    if (draft === "booked") {
      const value = Number(amount.replace(/[^\d]/g, ""));
      if (!Number.isFinite(value) || value <= 0) {
        setError(strings.amountHint);
        return;
      }
      save({ status: draft, amount: value });
    } else {
      if (reason.trim().length < 3) {
        setError(strings.reasonHint);
        return;
      }
      save({ status: draft, reason: reason.trim() });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lead-status">{strings.status}</Label>
          <select
            id="lead-status"
            className={selectClass}
            value={draft ?? status}
            disabled={pending}
            onChange={(event) => onStatus(event.target.value as LeadStatus)}
          >
            {statuses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lead-assignee">{strings.assignee}</Label>
          <select
            id="lead-assignee"
            className={selectClass}
            value={assigneeId ?? ""}
            disabled={pending}
            onChange={(event) => save({ assigneeId: event.target.value || null })}
          >
            <option value="">{strings.unassigned}</option>
            {staff.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lead-priority">{strings.priority}</Label>
          <select
            id="lead-priority"
            className={selectClass}
            value={priority}
            disabled={pending}
            onChange={(event) => save({ priority: event.target.value as LeadPriority })}
          >
            {priorities.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {draft ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-electric-200 bg-electric-50 p-4">
          {draft === "booked" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lead-amount">{strings.amount}</Label>
              <Input
                id="lead-amount"
                inputMode="numeric"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                aria-describedby="lead-amount-hint"
                className="tabular-nums"
              />
              <p id="lead-amount-hint" className="text-[13px] text-mist-600">
                {strings.amountHint}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lead-reason">{strings.reason}</Label>
              <Input
                id="lead-reason"
                value={reason}
                maxLength={300}
                onChange={(event) => setReason(event.target.value)}
                aria-describedby="lead-reason-hint"
              />
              <p id="lead-reason-hint" className="text-[13px] text-mist-600">
                {strings.reasonHint}
              </p>
            </div>
          )}
          {error ? (
            <p role="alert" className="text-[13.5px] font-medium text-danger-600">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button size="sm" onClick={confirm} loading={pending}>
              {strings.confirm.replace(
                "{status}",
                statuses.find((option) => option.value === draft)?.label ?? draft,
              )}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDraft(null)} disabled={pending}>
              {strings.cancel}
            </Button>
          </div>
        </div>
      ) : error ? (
        <p role="alert" className="text-[13.5px] font-medium text-danger-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { LeadControls };
