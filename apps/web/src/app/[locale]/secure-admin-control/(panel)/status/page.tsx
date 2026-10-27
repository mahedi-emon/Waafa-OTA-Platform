import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { formatDate, formatTime } from "@waafa/shared";
import { ActionButton } from "@/components/admin/ActionButton";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SettingsFrame } from "@/components/admin/settings/SettingsFrame";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminGet, hasRole, requireStaff } from "@/lib/admin/adminApi";
import { decideFailedJob } from "@/lib/admin/statusActions";

type Check = { ok: boolean; ms: number | null };
type Overview = {
  release: string;
  startedAt: string;
  checkedAt: string;
  database: Check;
  redis: Check;
  worker: { ok: boolean; lastSeen: string | null };
  queue: Record<"waiting" | "active" | "delayed" | "failed", number> | null;
  memory: { totalBytes: number; freeBytes: number };
  disk: { totalBytes: number; freeBytes: number } | null;
};
type FailedJob = {
  id: string;
  name: string;
  to: string | null;
  subject: string | null;
  reason: string;
  attempts: number;
  failedAt: string | null;
};

const when = (iso: string) => `${formatDate(iso)}, ${formatTime(iso)}`;
const gb = (bytes: number) => `${(bytes / 1024 ** 3).toFixed(1)} GB`;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.status");
  return { title: t("metaTitle") };
}

async function Status() {
  const [staff, t, tf] = await Promise.all([
    requireStaff(),
    getTranslations("Admin.status"),
    getTranslations("Admin.forbidden"),
  ]);
  if (!hasRole(staff, "admin")) return <AdminPageHeader title={tf("title")} lead={tf("body")} />;
  const [overview, failed] = await Promise.all([
    adminGet<Overview>("/admin/status"),
    adminGet<FailedJob[]>("/admin/status/failed"),
  ]);
  const check = (ok: boolean, text: string) => (
    <Badge variant={ok ? "success" : "danger"}>{text}</Badge>
  );
  const parts = [
    {
      name: t("database"),
      state: check(
        overview.database.ok,
        overview.database.ok ? t("up", { ms: overview.database.ms ?? 0 }) : t("down"),
      ),
    },
    {
      name: t("redis"),
      state: check(
        overview.redis.ok,
        overview.redis.ok ? t("up", { ms: overview.redis.ms ?? 0 }) : t("down"),
      ),
    },
    {
      name: t("worker"),
      state: check(
        overview.worker.ok,
        overview.worker.ok && overview.worker.lastSeen
          ? t("workerUp", { time: when(overview.worker.lastSeen) })
          : overview.worker.lastSeen
            ? t("workerDown")
            : t("workerNever"),
      ),
    },
    {
      name: t("memory"),
      state: t("free", {
        free: gb(overview.memory.freeBytes),
        total: gb(overview.memory.totalBytes),
      }),
    },
    {
      name: t("disk"),
      state: overview.disk
        ? t("free", { free: gb(overview.disk.freeBytes), total: gb(overview.disk.totalBytes) })
        : t("unknown"),
    },
  ];

  return (
    <SettingsFrame current="status">
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <p className="text-sm text-mist-600">
        {t("release")}: <span className="font-mono text-navy-900">{overview.release}</span> ·{" "}
        {t("startedAt", { time: when(overview.startedAt) })} ·{" "}
        {t("checkedAt", { time: when(overview.checkedAt) })}
      </p>
      <section
        aria-labelledby="status-parts"
        className="flex min-w-0 flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5"
      >
        <h2 id="status-parts" className="font-display text-lg font-bold text-navy-900">
          {t("parts")}
        </h2>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {parts.map((part) => (
            <div key={part.name} className="flex min-w-0 flex-col gap-1">
              <dt className="text-sm font-semibold text-navy-900">{part.name}</dt>
              <dd className="text-sm text-mist-700">{part.state}</dd>
            </div>
          ))}
          {overview.queue ? (
            <div className="flex min-w-0 flex-col gap-1 sm:col-span-2">
              <dt className="text-sm font-semibold text-navy-900">{t("queue")}</dt>
              <dd className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-mist-700 tabular-nums">
                <span>
                  {t("waiting")}: {overview.queue.waiting}
                </span>
                <span>
                  {t("active")}: {overview.queue.active}
                </span>
                <span>
                  {t("delayed")}: {overview.queue.delayed}
                </span>
                <span className={overview.queue.failed > 0 ? "font-semibold text-danger-700" : ""}>
                  {t("failedCount")}: {overview.queue.failed}
                </span>
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section
        aria-labelledby="status-failed"
        className="flex min-w-0 flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5"
      >
        <div>
          <h2 id="status-failed" className="font-display text-lg font-bold text-navy-900">
            {t("failedTitle")}
          </h2>
          <p className="text-[13.5px] text-mist-600">{t("failedLead")}</p>
        </div>
        {failed.length === 0 ? (
          <p className="text-sm text-mist-600">{t("failedEmpty")}</p>
        ) : (
          <div className="min-w-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">{t("to")}</TableHead>
                  <TableHead scope="col">{t("subject")}</TableHead>
                  <TableHead scope="col">{t("reason")}</TableHead>
                  <TableHead scope="col">{t("failedAt")}</TableHead>
                  <TableHead scope="col">
                    <span className="sr-only">{t("retry")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failed.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="break-all">{job.to ?? "—"}</TableCell>
                    <TableCell>{job.subject ?? job.name}</TableCell>
                    <TableCell className="max-w-xs text-mist-700">{job.reason}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {job.failedAt ? when(job.failedAt) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <ActionButton
                          action={decideFailedJob.bind(null, job.id, "retry")}
                          success={t("retried")}
                          failed={t("failed")}
                        >
                          {t("retry")}
                        </ActionButton>
                        <ActionButton
                          action={decideFailedJob.bind(null, job.id, "discard")}
                          success={t("discarded")}
                          failed={t("failed")}
                          confirm={t("discardConfirm")}
                          variant="ghost"
                        >
                          {t("discard")}
                        </ActionButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </SettingsFrame>
  );
}

/** Admin › Settings › System status (issue 238): health, the email queue and its dead-letter list. */
export default function StatusPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[480px] rounded-2xl" />}>
      <Status />
    </Suspense>
  );
}
