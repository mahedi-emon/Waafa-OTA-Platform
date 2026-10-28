"use client";

import { useId, useRef, useState, useTransition } from "react";
import { FileUp } from "lucide-react";
import { toast } from "sonner";
import type { ContentImportReport, CsvImportRow } from "@waafa/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "@/i18n/navigation";
import { importCsv } from "@/lib/admin/contentActions";

export type CsvImportStrings = {
  open: string;
  title: string;
  intro: string;
  file: string;
  fileHelp: string;
  reading: string;
  summary: string;
  ignored: string;
  line: string;
  record: string;
  result: string;
  actions: Record<CsvImportRow["action"], string>;
  changed: string;
  /** "Showing the first {shown} of {total} lines" */
  more: string;
  apply: string;
  applying: string;
  nothing: string;
  done: string;
  failed: string;
  tooBig: string;
  cancel: string;
};

const MAX_BYTES = 600_000;
/** Lines the preview shows: problems first, then changes; the counts cover the whole file. */
const SHOWN = 150;

const VARIANT: Record<CsvImportRow["action"], "danger" | "success" | "brand" | "neutral"> = {
  error: "danger",
  create: "success",
  update: "brand",
  unchanged: "neutral",
};

const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (match, name: string) => String(values[name] ?? match));

/**
 * Import a list from a CSV file (issue 248): choose the file, read the preview (what each line would do, problems in
 * plain words with the line and column), then import; a file with problems can't be imported.
 */
export function CsvImportDialog({
  listKey,
  strings,
}: {
  listKey: string;
  strings: CsvImportStrings;
}) {
  const id = useId();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState<string | null>(null);
  const [report, setReport] = useState<ContentImportReport | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const reset = () => {
    setCsv(null);
    setReport(null);
    setMessage(null);
    if (input.current) input.current.value = "";
  };

  const choose = (file: File | undefined) => {
    // The chosen file stays named in the input; only the last preview goes.
    setCsv(null);
    setReport(null);
    setMessage(null);
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setMessage(strings.tooBig);
      return;
    }
    start(async () => {
      const text = await file.text();
      const result = await importCsv(listKey, text, false);
      if (result.ok || result.report) {
        setCsv(text);
        setReport(result.ok ? result.report : (result.report ?? null));
      } else setMessage(result.message ?? strings.failed);
    });
  };

  const apply = () => {
    if (!csv) return;
    start(async () => {
      const result = await importCsv(listKey, csv, true);
      if (result.ok) {
        const { create, update } = result.report.summary;
        toast.success(fill(strings.done, { create, update }));
        setOpen(false);
        reset();
        router.refresh();
      } else if (result.report) setReport(result.report);
      else setMessage(result.message ?? strings.failed);
    });
  };

  const rows = report
    ? [...report.rows]
        .filter((row) => row.action !== "unchanged")
        .sort(
          (a, b) => Number(b.action === "error") - Number(a.action === "error") || a.line - b.line,
        )
    : [];
  const changes = report ? report.summary.create + report.summary.update : 0;
  const blocked = !report || report.fileProblems.length > 0 || report.summary.error > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <FileUp aria-hidden="true" className="size-4" />
          {strings.open}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{strings.title}</DialogTitle>
          <DialogDescription>{strings.intro}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-file`}>{strings.file}</Label>
          <input
            ref={input}
            id={`${id}-file`}
            type="file"
            accept=".csv,text/csv"
            aria-describedby={`${id}-help`}
            disabled={pending}
            onChange={(event) => choose(event.target.files?.[0])}
            className="min-h-11 w-full rounded-lg border border-mist-200 bg-white px-3 py-2 text-[14.5px] file:mr-3 file:rounded-md file:border-0 file:bg-mist-100 file:px-3 file:py-1.5 file:font-semibold file:text-navy-900"
          />
          <p id={`${id}-help`} className="text-[13px] text-mist-600">
            {strings.fileHelp}
          </p>
        </div>

        <div aria-live="polite" className="flex flex-col gap-3">
          {pending && !report ? (
            <p className="text-[14px] text-mist-700">{strings.reading}</p>
          ) : null}
          {message ? (
            <p role="alert" className="text-[14px] font-semibold text-danger-700">
              {message}
            </p>
          ) : null}
          {report ? (
            <>
              {report.fileProblems.map((problem) => (
                <p key={problem} role="alert" className="text-[14px] font-semibold text-danger-700">
                  {problem}
                </p>
              ))}
              {report.fileProblems.length === 0 ? (
                <p className="text-[14.5px] text-ink-900">
                  {fill(strings.summary, report.summary)}
                </p>
              ) : null}
              {report.ignoredColumns.length > 0 ? (
                <p className="text-[13px] text-mist-600">
                  {fill(strings.ignored, { columns: report.ignoredColumns.join(", ") })}
                </p>
              ) : null}
            </>
          ) : null}
        </div>

        {rows.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-mist-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="w-16">
                    {strings.line}
                  </TableHead>
                  <TableHead scope="col">{strings.record}</TableHead>
                  <TableHead scope="col">{strings.result}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, SHOWN).map((row) => (
                  <TableRow key={row.line}>
                    <TableCell className="tabular-nums">{row.line}</TableCell>
                    <TableCell className="max-w-48 break-all">{row.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <Badge variant={VARIANT[row.action]}>{strings.actions[row.action]}</Badge>
                        {row.problems.map((problem) => (
                          <span
                            key={`${problem.column}-${problem.message}`}
                            className="text-[13.5px] text-danger-700"
                          >
                            {problem.column}: {problem.message}
                          </span>
                        ))}
                        {row.action === "update" && row.changes.length > 0 ? (
                          <span className="text-[13px] text-mist-600">
                            {fill(strings.changed, { columns: row.changes.join(", ") })}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {rows.length > SHOWN ? (
              <p className="border-t border-mist-200 px-4 py-2 text-[13px] text-mist-600">
                {fill(strings.more, { shown: SHOWN, total: rows.length })}
              </p>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {strings.cancel}
          </Button>
          <Button onClick={apply} disabled={blocked || changes === 0 || pending}>
            {pending && report
              ? strings.applying
              : report && !blocked && changes === 0
                ? strings.nothing
                : fill(strings.apply, { count: changes })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
