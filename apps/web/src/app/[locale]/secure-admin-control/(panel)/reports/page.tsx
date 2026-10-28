import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Download } from "@/components/icons/server/Download";
import { formatTaka } from "@waafa/shared";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import { adminGet, hasRole, requireStaff } from "@/lib/admin/adminApi";
import { dhakaToday, rangePresets } from "@/lib/admin/dateRanges";
import { ReportAgents, type AgentRow } from "./_components/ReportAgents";
import { ReportBars } from "./_components/ReportBars";
import { ReportList } from "./_components/ReportList";
import { ReportSources, type SourceRow } from "./_components/ReportSources";
import { ReportRange } from "./_components/ReportRange";
import { dateRangeStrings } from "@/lib/admin/dateRangeStrings";

type SearchActivity = {
  total: number;
  leads: number;
  searchToLeadRate: number;
  topRoutes: Array<{ module: string; summary: string; count: number }>;
};

type Summary = {
  range: { from: string; to: string };
  leads: {
    total: number;
    won: number;
    wonRate: number;
    medianFirstResponseMinutes: number | null;
    byModule: Array<{ module: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
  };
  orders: {
    total: number;
    sold: number;
    revenue: number;
    averageOrder: number;
    byStatus: Array<{ status: string; count: number }>;
    topProducts: Array<{ title: string; sku: string; units: number; revenue: number }>;
  } | null;
  feedback: Array<{ status: string; count: number }>;
  signUps: number;
  days: Array<{ day: string; leads: number; orders: number; revenue: number; searches?: number }>;
  sources?: SourceRow[];
  /** Issue 244: leads by agent, the funnel from search to booking, visa cases. */
  byAgent?: AgentRow[];
  funnel?: Array<{
    step: "searches" | "requests" | "replied" | "quoted" | "booked";
    count: number;
  }>;
  visa?: {
    total: number;
    byStage: Array<{ stage: string; count: number }>;
    byCountry: Array<{ country: string; count: number; approved: number; rejected: number }>;
  } | null;
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.reports");
  return { title: t("metaTitle") };
}

async function Reports({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/reports">["searchParams"];
}) {
  const params = await searchParams;
  // The default range reads today's date: render at request time, never while prerendering (issue 119).
  await connection();
  const today = dhakaToday();
  const fallback = rangePresets(today).last30;
  const from =
    typeof params.from === "string" && DAY.test(params.from) ? params.from : fallback.from;
  const to = typeof params.to === "string" && DAY.test(params.to) ? params.to : fallback.to;
  const [t, tm, ts, to2, staff, tvs] = await Promise.all([
    getTranslations("Admin.reports"),
    getTranslations("Admin.modules"),
    getTranslations("Admin.statuses"),
    getTranslations("Admin.orders.statuses"),
    requireStaff(),
    getTranslations("Admin.visaProgress.stages"),
  ]);
  // What people searched on the site in the same days (search activity, D0 R9).
  const searches = hasRole(staff, "admin", "travel-sales");
  const [summary, activity] = await Promise.all([
    adminGet<Summary>("/admin/reports", { from, to }),
    searches
      ? adminGet<SearchActivity>("/admin/search-logs", { from, to, pageSize: 1 }).catch(() => null)
      : null,
  ]);
  const label = (bag: typeof tm, key: string) => (bag.has(key as never) ? bag(key as never) : key);
  const downloads = (["leads", "orders", "feedback", "subscribers"] as const).filter(
    (dataset) => dataset !== "orders" || summary.orders,
  );
  const cards = [
    { label: t("leads"), value: String(summary.leads.total) },
    { label: t("won"), value: `${summary.leads.won} · ${summary.leads.wonRate}%` },
    {
      label: t("firstResponse"),
      value:
        summary.leads.medianFirstResponseMinutes === null
          ? "—"
          : t("minutes", { count: summary.leads.medianFirstResponseMinutes }),
    },
    ...(summary.orders
      ? [
          { label: t("ordersSold"), value: `${summary.orders.sold} / ${summary.orders.total}` },
          { label: t("revenue"), value: formatTaka(summary.orders.revenue) },
          { label: t("averageOrder"), value: formatTaka(summary.orders.averageOrder) },
        ]
      : []),
    { label: t("signUps"), value: String(summary.signUps) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <ReportRange
        range={{ from, to }}
        today={today}
        path="/secure-admin-control/reports"
        strings={{
          label: t("range"),
          last7: t("presets.last7"),
          last30: t("presets.last30"),
          thisMonth: t("presets.thisMonth"),
          lastMonth: t("presets.lastMonth"),
        }}
        picker={await dateRangeStrings()}
      />

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={t("kpis")}>
        {cards.map((card) => (
          <li key={card.label} className="rounded-2xl border border-mist-200 bg-white p-4">
            <p className="text-[13px] font-medium text-mist-600">{card.label}</p>
            <p className="mt-1 font-display text-[22px] font-extrabold text-navy-900 tabular-nums">
              {card.value}
            </p>
          </li>
        ))}
      </ul>

      <ReportBars
        title={t("perDay")}
        days={summary.days}
        showRevenue={summary.orders !== null}
        strings={{
          date: t("date"),
          leads: t("leads"),
          orders: t("orders"),
          revenue: t("revenue"),
          empty: t("empty"),
        }}
      />

      {searches && summary.funnel ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ReportBars
            id="report-searches-per-day"
            title={t("searchesPerDay")}
            days={summary.days.map((day) => ({
              day: day.day,
              leads: day.searches ?? 0,
              orders: 0,
              revenue: 0,
            }))}
            showRevenue={false}
            strings={{
              date: t("date"),
              leads: t("searchesSeries"),
              orders: t("orders"),
              revenue: t("revenue"),
              empty: t("empty"),
            }}
          />
          <ReportList
            title={t("funnel.title")}
            rows={summary.funnel.map((step, index, all) => {
              const before = index === 0 ? step.count : (all[index - 1]?.count ?? 0);
              const share = before === 0 ? 0 : Math.round((step.count / before) * 100);
              return {
                label: t(`funnel.${step.step}`),
                value: step.count,
                display: index === 0 ? String(step.count) : `${step.count} · ${share}%`,
              };
            })}
            empty={t("empty")}
          />
        </div>
      ) : null}

      {summary.byAgent ? (
        <ReportAgents
          rows={summary.byAgent}
          strings={{
            title: t("agents.title"),
            lead: t("agents.lead"),
            agent: t("agents.agent"),
            leads: t("leads"),
            booked: t("won"),
            wonRate: t("agents.wonRate"),
            reply: t("firstResponse"),
            minutes: (count) => t("minutes", { count }),
            empty: t("empty"),
          }}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {summary.visa && summary.visa.total > 0 ? (
          <>
            <ReportList
              title={t("visa.byStage")}
              rows={summary.visa.byStage.map((row) => ({
                label: label(tvs as unknown as typeof tm, row.stage),
                value: row.count,
              }))}
              empty={t("empty")}
            />
            <ReportList
              title={t("visa.byCountry")}
              rows={summary.visa.byCountry.map((row) => ({
                label: row.country,
                value: row.count,
                display: t("visa.outcomes", {
                  count: row.count,
                  approved: row.approved,
                  rejected: row.rejected,
                }),
              }))}
              empty={t("empty")}
            />
          </>
        ) : null}
        <ReportList
          title={t("byModule")}
          rows={summary.leads.byModule.map((row) => ({
            label: label(tm, row.module),
            value: row.count,
          }))}
          empty={t("empty")}
        />
        <ReportList
          title={t("byStatus")}
          rows={summary.leads.byStatus.map((row) => ({
            label: label(ts, row.status),
            value: row.count,
          }))}
          empty={t("empty")}
        />
        {summary.orders ? (
          <>
            <ReportList
              title={t("orderStatus")}
              rows={summary.orders.byStatus.map((row) => ({
                label: label(to2, row.status),
                value: row.count,
              }))}
              empty={t("empty")}
            />
            <ReportList
              title={t("topProducts")}
              rows={summary.orders.topProducts.map((row) => ({
                label: `${row.title} (${row.units})`,
                value: row.revenue,
                display: formatTaka(row.revenue),
              }))}
              empty={t("empty")}
            />
          </>
        ) : null}
        <ReportSources
          rows={summary.sources ?? []}
          showOrders={summary.orders !== null}
          strings={{
            title: t("sources.title"),
            lead: t("sources.lead"),
            source: t("sources.source"),
            campaign: t("sources.campaign"),
            leads: t("sources.leads"),
            booked: t("sources.booked"),
            orders: t("sources.orders"),
            revenue: t("sources.revenue"),
            empty: t("empty"),
          }}
        />
        {activity ? (
          <section
            aria-labelledby="report-searches"
            className="flex min-w-0 flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 id="report-searches" className="font-display text-lg font-bold text-navy-900">
                  {t("searches")}
                </h2>
                <p className="text-[13.5px] text-mist-600">
                  {t("searchesLead", {
                    total: activity.total,
                    rate: activity.searchToLeadRate,
                  })}
                </p>
              </div>
              <Link
                href={`/secure-admin-control/search?from=${from}&to=${to}`}
                prefetch={false}
                className="text-[13.5px] font-semibold text-brand-700 hover:underline"
              >
                {t("allSearches")}
              </Link>
            </div>
            {activity.topRoutes.length === 0 ? (
              <p className="text-[14px] text-mist-600">{t("empty")}</p>
            ) : (
              <ol className="flex flex-col divide-y divide-mist-100">
                {activity.topRoutes.map((row) => (
                  <li
                    key={`${row.module}-${row.summary}`}
                    className="flex items-center justify-between gap-3 py-2 text-[14px]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink-900">{row.summary}</span>
                      <span className="text-[12.5px] text-mist-600">{label(tm, row.module)}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-navy-900 tabular-nums">
                      {row.count}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        ) : null}
        <ReportList
          title={t("feedback")}
          rows={summary.feedback.map((row) => ({ label: row.status, value: row.count }))}
          empty={t("empty")}
        />
      </div>

      <section
        aria-labelledby="report-downloads"
        className="flex flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5"
      >
        <h2 id="report-downloads" className="font-display text-lg font-bold text-navy-900">
          {t("downloads")}
        </h2>
        <p className="text-sm text-mist-600">{t("downloadsHint")}</p>
        <ul className="flex flex-col divide-y divide-mist-100">
          {downloads.map((dataset) => (
            <li
              key={dataset}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
            >
              <span className="font-medium text-navy-900">{t(`datasets.${dataset}`)}</span>
              <span className="flex gap-2">
                {(["xlsx", "csv"] as const).map((format) => (
                  <Button key={format} asChild variant="secondary" size="sm">
                    <a
                      href={`/secure-admin-control/reports/download?dataset=${dataset}&format=${format}&from=${from}&to=${to}`}
                      download
                      aria-label={t(`downloadAs.${format}`, { report: t(`datasets.${dataset}`) })}
                    >
                      <Download aria-hidden="true" />
                      {t(`formats.${format}`)}
                    </a>
                  </Button>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Admin › Reports (issue 111): a date range in Dhaka days, KPIs, a daily chart, breakdowns and CSV downloads. */
export default function ReportsPage(props: PageProps<"/[locale]/secure-admin-control/reports">) {
  return (
    <Suspense fallback={<Skeleton className="h-[480px] rounded-2xl" />}>
      <Reports searchParams={props.searchParams} />
    </Suspense>
  );
}
