import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGet } from "@/lib/admin/adminApi";
import { formatDhakaDateTime } from "@/lib/admin/format";
import type { AuditRow, Paged } from "@/lib/admin/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.audit");
  return { title: t("metaTitle") };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

async function Audit({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/admin/audit">["searchParams"];
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(one(params.page)) || 1);
  const entity = one(params.entity)?.slice(0, 40);
  const [list, t, tc] = await Promise.all([
    adminGet<Paged<AuditRow>>("/admin/audit", { entity, page, pageSize: 40 }),
    getTranslations("Admin.audit"),
    getTranslations("Admin.common"),
  ]);
  return (
    <>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <section className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
        <ul className="divide-y divide-mist-100">
          {list.items.map((row) => (
            <li key={row.id} className="px-5 py-3">
              <div className="flex flex-col gap-0.5 md:flex-row md:items-baseline md:gap-4">
                <time className="shrink-0 text-[12.5px] text-mist-500" dateTime={row.at}>
                  {formatDhakaDateTime(row.at)}
                </time>
                <p className="min-w-0 flex-1 text-[14px]">
                  <span className="font-semibold text-navy-900">{row.actor}</span> · {row.action} ·{" "}
                  <span className="font-mono text-[13px]">
                    {row.entity}/{row.entityId}
                  </span>
                  {row.reason ? <span className="text-mist-600"> · {row.reason}</span> : null}
                </p>
              </div>
              {row.before !== null || row.after !== null ? (
                <details className="mt-1.5">
                  <summary className="cursor-pointer text-[13px] font-semibold text-brand-700">
                    {t("showChange")}
                  </summary>
                  <div className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-2">
                    {[
                      [t("before"), row.before],
                      [t("after"), row.after],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="min-w-0">
                        <p className="text-[12px] font-semibold text-mist-600">{String(label)}</p>
                        <pre className="mt-1 max-h-64 overflow-auto rounded-xl bg-mist-50 p-3 font-mono text-[12px] leading-relaxed text-ink-900">
                          {value === null || value === undefined
                            ? "-"
                            : JSON.stringify(value, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}
            </li>
          ))}
        </ul>
        <AdminPagination
          page={list.page}
          pageSize={list.pageSize}
          total={list.total}
          path="/admin/audit"
          query={{ entity }}
          strings={{
            previous: tc("previous"),
            next: tc("next"),
            summary: tc("showing", { shown: list.items.length, total: list.total }),
          }}
        />
      </section>
    </>
  );
}

/** Audit log: every admin write with before and after values (PRD §13). */
export default function AuditPage(props: PageProps<"/[locale]/admin/audit">) {
  return (
    <Suspense fallback={<Skeleton className="h-[560px] rounded-2xl" />}>
      <Audit searchParams={props.searchParams} />
    </Suspense>
  );
}
