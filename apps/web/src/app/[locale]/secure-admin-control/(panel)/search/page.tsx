import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { BarList } from "@/components/admin/BarList";
import { KpiCard } from "@/components/admin/KpiCard";
import { StatusTabs } from "@/components/admin/StatusTabs";
import { AdminDataTable } from "@/components/admin/table/AdminDataTable";
import { pageSizeOf } from "@/components/admin/table/listQuery";
import type { ColumnSpec, DataRow } from "@/components/admin/table/types";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGet } from "@/lib/admin/adminApi";
import { formatDhakaDateTime, pageParam } from "@/lib/admin/format";
import type { SearchActivity } from "@/lib/admin/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.search");
  return { title: t("metaTitle") };
}

const MODULES = ["flights", "hotels", "packages", "visa"] as const;
const PATH = "/secure-admin-control/search";
const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

async function Activity({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/search">["searchParams"];
}) {
  const params = await searchParams;
  const area = MODULES.find((item) => item === one(params.module));
  const q = one(params.q)?.slice(0, 80);
  const [data, t, tc, tm, td] = await Promise.all([
    adminGet<SearchActivity>("/admin/search-logs", {
      module: area,
      page: pageParam(params.page),
      pageSize: pageSizeOf(params.pageSize),
      ...(q ? { q } : {}),
    }),
    getTranslations("Admin.search"),
    getTranslations("Admin.common"),
    getTranslations("Admin.modules"),
    getTranslations("Admin.dashboard"),
  ]);
  const moduleName = (value: string) =>
    MODULES.includes(value as (typeof MODULES)[number]) ? tm(value as "flights") : value;

  const rows: DataRow[] = data.items.map((item) => {
    const when = formatDhakaDateTime(item.createdAt);
    return {
      id: item.id,
      title: item.summary,
      subtitle: moduleName(item.module),
      chips: [],
      facts: {
        module: { text: moduleName(item.module) },
        device: { text: item.device ?? "", kind: "muted" },
        source: { text: item.source ?? "", kind: "muted" },
        when: { text: when, kind: "date" },
      },
      summary: [
        { label: t("colModule"), value: moduleName(item.module) },
        { label: t("colSearch"), value: item.summary },
        ...(item.device ? [{ label: t("colDevice"), value: item.device }] : []),
        ...(item.source ? [{ label: t("colSource"), value: item.source }] : []),
        { label: t("colWhen"), value: when },
      ],
    };
  });

  const columns: ColumnSpec[] = [
    { key: "name", label: t("colSearch"), always: true },
    { key: "module", label: t("colModule") },
    { key: "device", label: t("colDevice") },
    { key: "source", label: t("colSource") },
    { key: "when", label: t("colWhen") },
  ];

  return (
    <>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <StatusTabs
        label={t("title")}
        current={area ?? "all"}
        items={[
          { value: "all", label: tc("all"), href: PATH },
          ...MODULES.map((value) => ({
            value,
            label: tm(value),
            href: `${PATH}?module=${value}`,
          })),
        ]}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label={t("total")} value={data.total} />
        <KpiCard label={t("leads")} value={data.leads} />
        <KpiCard label={t("rate")} value={`${data.searchToLeadRate}%`} />
      </div>
      <AdminPanel title={t("topRoutes")} className="mt-4 mb-4">
        <BarList
          empty={td("noData")}
          rows={data.topRoutes.map((row) => ({
            key: `${row.module}-${row.summary}`,
            label: row.summary,
            value: row.count,
          }))}
        />
      </AdminPanel>
      <AdminDataTable
        listKey="search-logs"
        path={PATH}
        rows={rows}
        columns={columns}
        page={{ total: data.total, page: data.page, pageSize: data.pageSize }}
        searchLabel={t("searchBox")}
        openLabel={tc("open")}
        empty={{ title: t("emptyTitle"), body: t("emptyBody") }}
      />
    </>
  );
}

/** Search activity (AdminSearch board) on the shared DataTable (issue 229). */
export default function SearchActivityPage(
  props: PageProps<"/[locale]/secure-admin-control/search">,
) {
  return (
    <Suspense fallback={<Skeleton className="h-[560px] rounded-2xl" />}>
      <Activity searchParams={props.searchParams} />
    </Suspense>
  );
}
