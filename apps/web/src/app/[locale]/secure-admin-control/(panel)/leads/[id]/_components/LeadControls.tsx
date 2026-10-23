"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { LeadPriority } from "@waafa/shared";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { updateLead } from "@/lib/admin/leadActions";

type Option = { value: string; label: string };

type LeadControlsProps = {
  id: string;
  priority: LeadPriority;
  assigneeId: string | null;
  priorities: Option[];
  staff: Option[];
  strings: {
    assignee: string;
    priority: string;
    unassigned: string;
    updated: string;
    failed: string;
  };
};

const selectClass =
  "h-12 w-full cursor-pointer rounded-xl border border-mist-300 bg-white px-3 text-[15px] text-ink-900 focus-visible:border-electric-600 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none disabled:cursor-wait disabled:opacity-70";

/**
 * Who works on a lead and how urgent it is. The status is not here: it follows from the lead's steps (LeadActions,
 * D0 R4).
 */
function LeadControls({ id, priority, assigneeId, priorities, staff, strings }: LeadControlsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save(input: Parameters<typeof updateLead>[1]) {
    setError(null);
    startTransition(async () => {
      const result = await updateLead(id, input);
      if (!result.ok) {
        const message = result.problem.fields?.[0]?.message ?? strings.failed;
        setError(message);
        toast.error(message);
        return;
      }
      toast.success(strings.updated);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
      {error ? (
        <p role="alert" className="text-[13.5px] font-medium text-danger-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { LeadControls };
