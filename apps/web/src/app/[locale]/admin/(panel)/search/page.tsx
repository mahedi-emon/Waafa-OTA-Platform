import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { BarList } from "@/components/admin/BarList";
import { KpiCard } from "@/components/admin/KpiCard";
import { StatusTabs } from "@/components/admin/StatusTabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminGet } from "@/lib/admin/adminApi";
import { formatDhakaDateTime } from "@/lib/admin/format";
import type { SearchActivity } from "@/lib/admin/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.search");
  return { title: t("metaTitle") };
}

const MODULES = ["flights", "hotels", "packages", "visa"] as const;
const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

async function Activity({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/admin/search">["searchParams"];
}) {
  const params = await searchParams;
  const area = MODULES.find((item) => item === one(params.module));
  const page = Math.max(1, Number(one(params.page)) || 1);
  const [data, t, tc, tm, td] = await Promise.all([
    adminGet<SearchActivity>("/admin/search-logs", { module: area, page, pageSize: 30 }),
    getTranslations("Admin.search"),
    getTranslations("Admin.common"),
    getTranslations("Admin.modules"),
    getTranslations("Admin.dashboard"),
  ]);

  return (
    <>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <StatusTabs
        label={t("title")}
        current={area ?? "all"}
        items={[
          { value: "all", label: tc("all"), href: "/admin/search" },
          ...MODULES.map((value) => ({
            value,
            label: tm(value),
            href: `/admin/search?module=${value}`,
          })),
        ]}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label={t("total")} value={data.total} />
        <KpiCard label={t("leads")} value={data.leads} />
        <KpiCard label={t("rate")} value={`${data.searchToLeadRate}%`} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <AdminPanel title={t("topRoutes")}>
          <BarList
            empty={td("noData")}
            rows={data.topRoutes.map((row) => ({
              key: `${row.module}-${row.summary}`,
              label: row.summary,
              value: row.count,
            }))}
          />
        </AdminPanel>
        <section className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("colWhen")}</TableHead>
                <TableHead>{t("colModule")}</TableHead>
                <TableHead>{t("colSearch")}</TableHead>
                <TableHead>{t("colDevice")}</TableHead>
                <TableHead>{t("colSource")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-[13px] whitespace-nowrap text-mist-600">
                    {formatDhakaDateTime(item.createdAt)}
                  </TableCell>
                  <TableCell>
                    {MODULES.includes(item.module as (typeof MODULES)[number])
                      ? tm(item.module as "flights")
                      : item.module}
                  </TableCell>
                  <TableCell className="max-w-[320px]">{item.summary}</TableCell>
                  <TableCell>{item.device ?? ""}</TableCell>
                  <TableCell className="text-[13px] text-mist-600">{item.source ?? ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <AdminPagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            path="/admin/search"
            query={{ module: area }}
            strings={{
              previous: tc("previous"),
              next: tc("next"),
              summary: tc("showing", { shown: data.items.length, total: data.total }),
            }}
          />
        </section>
      </div>
    </>
  );
}

/** Search activity (AdminSearch board). */
export default function SearchActivityPage(props: PageProps<"/[locale]/admin/search">) {
  return (
    <Suspense fallback={<Skeleton className="h-[560px] rounded-2xl" />}>
      <Activity searchParams={props.searchParams} />
    </Suspense>
  );
}
