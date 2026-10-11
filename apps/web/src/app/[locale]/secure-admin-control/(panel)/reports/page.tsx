import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Download } from "lucide-react";
import { formatTaka } from "@waafa/shared";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGet } from "@/lib/admin/adminApi";
import { ReportBars } from "./_components/ReportBars";
import { ReportList } from "./_components/ReportList";

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
  days: Array<{ day: string; leads: number; orders: number; revenue: number }>;
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Today in Asia/Dhaka as YYYY-MM-DD, and the same date `days` earlier. */
function defaultRange(days = 29) {
  const today = new Date(Date.now() + 6 * 60 * 60_000);
  const from = new Date(today.getTime() - days * 24 * 60 * 60_000);
  return { from: from.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) };
}

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
  const fallback = defaultRange();
  const from =
    typeof params.from === "string" && DAY.test(params.from) ? params.from : fallback.from;
  const to = typeof params.to === "string" && DAY.test(params.to) ? params.to : fallback.to;
  const [t, tm, ts, to2] = await Promise.all([
    getTranslations("Admin.reports"),
    getTranslations("Admin.modules"),
    getTranslations("Admin.statuses"),
    getTranslations("Admin.orders.statuses"),
  ]);
  const summary = await adminGet<Summary>("/admin/reports", { from, to });
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
    <>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <form
        action="/secure-admin-control/reports"
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-mist-200 bg-white p-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="report-from">{t("from")}</Label>
          <Input id="report-from" type="date" name="from" defaultValue={from} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="report-to">{t("to")}</Label>
          <Input id="report-to" type="date" name="to" defaultValue={to} required />
        </div>
        <Button type="submit">{t("show")}</Button>
      </form>

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
        strings={{ date: t("date"), leads: t("leads"), orders: t("orders"), revenue: t("revenue") }}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
        <div className="flex flex-wrap gap-2">
          {downloads.map((dataset) => (
            <Button key={dataset} asChild variant="secondary" size="sm">
              <a
                href={`/secure-admin-control/reports/download?dataset=${dataset}&from=${from}&to=${to}`}
                download
              >
                <Download aria-hidden="true" />
                {t(`datasets.${dataset}`)}
              </a>
            </Button>
          ))}
        </div>
      </section>
    </>
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
