"use client";

import { useState, useTransition } from "react";
import { Phone } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import type { LeadStatus } from "@waafa/shared";
import { LeadStatusBadge } from "@/components/admin/LeadStatusBadge";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link, useRouter } from "@/i18n/navigation";
import {
  displayPhone,
  formatDhakaDateTime,
  formatPlainDate,
  whatsappHref,
} from "@/lib/admin/format";
import { bulkUpdateLeads } from "@/lib/admin/leadActions";
import type { LeadRow, StaffDirectoryEntry } from "@/lib/admin/types";

const BULK_STATUSES = [
  "new",
  "pending",
  "in-progress",
  "quoted",
  "spam",
] as const satisfies readonly LeadStatus[];
type BulkStatus = (typeof BULK_STATUSES)[number];

type LeadsTableProps = {
  rows: LeadRow[];
  staff: StaffDirectoryEntry[];
  modules: Record<string, string>;
  statuses: Record<string, string>;
  ages: Record<string, string>;
  strings: {
    reference: string;
    customer: string;
    trip: string;
    date: string;
    status: string;
    assignee: string;
    age: string;
    source: string;
    duplicate: string;
    unassigned: string;
    selected: string;
    assignTo: string;
    changeStatus: string;
    apply: string;
    bulkDone: string;
    selectAll: string;
    select: string;
    call: string;
    whatsapp: string;
    open: string;
    failed: string;
  };
};

/**
 * The leads table (AdminLeads, AdminLeads-bulk, AdminLeads-m boards): table from 768 px, cards on phones, row selection
 * with a bulk bar (assign, change status), age in red past the reply target.
 */
function LeadsTable({ rows, staff, modules, statuses, ages, strings }: LeadsTableProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [assignee, setAssignee] = useState("");
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const allSelected = rows.length > 0 && selected.length === rows.length;
  const toggle = (id: string) =>
    setSelected((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]));

  function applyBulk() {
    if (selected.length === 0 || (!assignee && !status)) return;
    startTransition(async () => {
      const result = await bulkUpdateLeads({
        ids: selected,
        ...(assignee ? { assigneeId: assignee === "none" ? null : assignee } : {}),
        ...(status ? { status: status as BulkStatus } : {}),
      });
      if (!result.ok) {
        toast.error(strings.failed);
        return;
      }
      toast.success(strings.bulkDone.replace("{count}", String(result.changed ?? selected.length)));
      setSelected([]);
      setAssignee("");
      setStatus("");
      router.refresh();
    });
  }

  return (
    <div>
      {selected.length > 0 ? (
        <div className="sticky top-16 z-20 flex flex-col gap-3 border-b border-electric-200 bg-electric-50 px-5 py-3 md:flex-row md:items-center">
          <p className="font-semibold text-navy-900">
            {strings.selected.replace("{count}", String(selected.length))}
          </p>
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="bulk-assignee">
              {strings.assignTo}
            </label>
            <select
              id="bulk-assignee"
              value={assignee}
              onChange={(event) => setAssignee(event.target.value)}
              className="h-11 rounded-xl border border-mist-300 bg-white px-3 text-[14.5px]"
            >
              <option value="">{strings.assignTo}</option>
              <option value="none">{strings.unassigned}</option>
              {staff.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="bulk-status">
              {strings.changeStatus}
            </label>
            <select
              id="bulk-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-11 rounded-xl border border-mist-300 bg-white px-3 text-[14.5px]"
            >
              <option value="">{strings.changeStatus}</option>
              {BULK_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {statuses[value]}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={applyBulk} loading={pending} disabled={!assignee && !status}>
              {strings.apply}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox
                  aria-label={strings.selectAll}
                  checked={allSelected}
                  onCheckedChange={(value) =>
                    setSelected(value === true ? rows.map((row) => row.id) : [])
                  }
                />
              </TableHead>
              <TableHead>{strings.reference}</TableHead>
              <TableHead>{strings.customer}</TableHead>
              <TableHead>{strings.trip}</TableHead>
              <TableHead>{strings.date}</TableHead>
              <TableHead>{strings.status}</TableHead>
              <TableHead>{strings.assignee}</TableHead>
              <TableHead>{strings.age}</TableHead>
              <TableHead>{strings.source}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={selected.includes(row.id) ? "selected" : undefined}
                className={cn(row.overdue && "shadow-[inset_3px_0_0_var(--color-danger-600)]")}
              >
                <TableCell>
                  <Checkbox
                    aria-label={strings.select.replace("{reference}", row.reference)}
                    checked={selected.includes(row.id)}
                    onCheckedChange={() => toggle(row.id)}
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/leads/${row.id}`}
                    prefetch={false}
                    className="font-mono text-[13px] font-semibold text-brand-700 hover:underline"
                  >
                    {row.reference}
                  </Link>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge variant="outline">{modules[row.module] ?? row.module}</Badge>
                    {row.duplicateOf ? <Badge variant="warning">{strings.duplicate}</Badge> : null}
                  </div>
                </TableCell>
                <TableCell>
                  <p className="font-semibold">{row.name}</p>
                  <p className="text-[13px] text-mist-600 tabular-nums">
                    {displayPhone(row.phone)}
                  </p>
                </TableCell>
                <TableCell className="max-w-[280px]">
                  <p className="line-clamp-2">{row.summary}</p>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatPlainDate(row.travelDate)}
                </TableCell>
                <TableCell>
                  <LeadStatusBadge status={row.status} label={statuses[row.status] ?? row.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {row.assignee?.name ?? (
                    <span className="text-mist-500">{strings.unassigned}</span>
                  )}
                </TableCell>
                <TableCell
                  className={cn(
                    "whitespace-nowrap tabular-nums",
                    row.overdue ? "font-semibold text-danger-600" : "",
                  )}
                  title={formatDhakaDateTime(row.createdAt)}
                >
                  {ages[row.id]}
                </TableCell>
                <TableCell className="text-[13px] text-mist-600">{row.source}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="flex flex-col gap-3 p-4 md:hidden">
        {rows.map((row) => (
          <li
            key={row.id}
            className={cn(
              "rounded-2xl border bg-white p-4",
              row.overdue ? "border-danger-600/40" : "border-mist-200",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12.5px] font-semibold text-mist-600">
                {modules[row.module] ?? row.module} ·{" "}
                <span className="font-mono">{row.reference}</span>
              </span>
              <LeadStatusBadge status={row.status} label={statuses[row.status] ?? row.status} />
            </div>
            <Link href={`/admin/leads/${row.id}`} prefetch={false} className="mt-2 block">
              <p className="font-semibold text-navy-900">{row.name}</p>
              <p className="mt-0.5 line-clamp-2 text-[14px] text-ink-900">
                {row.summary}
                {row.travelDate ? ` · ${formatPlainDate(row.travelDate)}` : ""}
              </p>
            </Link>
            <p className="mt-2 text-[13px] text-mist-600">
              {row.assignee?.name ?? strings.unassigned} ·{" "}
              <span className={row.overdue ? "font-semibold text-danger-600" : ""}>
                {ages[row.id]}
              </span>
            </p>
            <div className="mt-3 flex gap-2">
              <Button asChild variant="secondary" size="sm">
                <a href={`tel:${row.phone}`}>
                  <Phone aria-hidden="true" className="size-4" />
                  {strings.call}
                </a>
              </Button>
              <Button asChild variant="whatsapp" size="sm">
                <a
                  href={whatsappHref(row.phone, row.reference)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon className="size-4" />
                  {strings.whatsapp}
                </a>
              </Button>
              <Button asChild variant="soft" size="sm" className="ml-auto">
                <Link href={`/admin/leads/${row.id}`} prefetch={false}>
                  {strings.open}
                </Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { LeadsTable };
