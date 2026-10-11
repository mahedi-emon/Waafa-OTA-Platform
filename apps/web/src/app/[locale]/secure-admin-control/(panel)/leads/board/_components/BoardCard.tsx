"use client";

import { useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import type { LeadStatus } from "@waafa/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { updateLead } from "@/lib/admin/leadActions";

type BoardCardProps = {
  lead: {
    id: string;
    reference: string;
    name: string;
    summary: string;
    module: string;
    status: LeadStatus;
    assignee: string | null;
    age: string;
    overdue: boolean;
  };
  stages: LeadStatus[];
  stageNames: Record<LeadStatus, string>;
  strings: {
    moveTo: string;
    /** Contains {stage}. */
    moveBack: string;
    /** Contains {stage}. */
    moveForward: string;
    /** Contains {reference} and {stage}. */
    moved: string;
    open: string;
    bookHint: string;
    overdue: string;
    unassigned: string;
    failed: string;
  };
};

const fill = (text: string, values: Record<string, string>) =>
  text.replace(/\{(\w+)\}/g, (_match, key: string) => values[key] ?? "");

/**
 * One lead on the board (issue 113): previous and next stage buttons move it in one press (keyboard and touch
 * friendly); Booked needs the amount, so that step opens the lead instead.
 */
function BoardCard({ lead, stages, stageNames, strings }: BoardCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const index = stages.indexOf(lead.status);
  const previous = index > 0 ? stages[index - 1] : undefined;
  const next = index >= 0 && index < stages.length - 1 ? stages[index + 1] : undefined;

  function move(stage: LeadStatus) {
    startTransition(async () => {
      const result = await updateLead(lead.id, { status: stage });
      if (!result.ok) {
        toast.error(result.problem.detail ?? strings.failed);
        return;
      }
      toast.success(fill(strings.moved, { reference: lead.reference, stage: stageNames[stage] }));
      router.refresh();
    });
  }

  return (
    <li
      className={cn(
        "flex min-w-0 flex-col gap-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-mist-200",
        lead.overdue && "ring-warning-700/40",
        pending && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/secure-admin-control/leads/${lead.id}`}
          className="min-w-0 font-semibold text-navy-900 hover:underline"
        >
          {lead.reference}
          <span className="block truncate text-[13px] font-normal text-mist-700">{lead.name}</span>
        </Link>
        <Badge variant="neutral">{lead.module}</Badge>
      </div>
      <p className="line-clamp-2 text-[13px] text-ink-900">{lead.summary}</p>
      <p className="flex flex-wrap items-center gap-x-2 text-[12px] text-mist-600">
        <span>{lead.age}</span>
        <span aria-hidden="true">·</span>
        <span>{lead.assignee ?? strings.unassigned}</span>
        {lead.overdue ? <Badge variant="warning">{strings.overdue}</Badge> : null}
      </p>
      <div
        className="flex items-center justify-between gap-2"
        role="group"
        aria-label={strings.moveTo}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={!previous || pending}
          aria-label={
            previous ? fill(strings.moveBack, { stage: stageNames[previous] }) : strings.moveTo
          }
          onClick={() => previous && move(previous)}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        {next === "booked" ? (
          <Button asChild variant="link" size="sm" className="h-auto px-0 text-[12.5px]">
            <Link href={`/secure-admin-control/leads/${lead.id}`} title={strings.bookHint}>
              {strings.open}
            </Link>
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={!next || next === "booked" || pending}
          aria-label={
            next ? fill(strings.moveForward, { stage: stageNames[next] }) : strings.moveTo
          }
          onClick={() => next && next !== "booked" && move(next)}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}

export { BoardCard };
