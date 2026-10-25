import { Suspense } from "react";
import type { Metadata } from "next";
import { Columns3 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LeadModuleSchema, LeadStatusSchema, type LeadModule } from "@waafa/shared";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { LeadContactButtons } from "@/components/admin/inbox/LeadContactButtons";
import { LeadModuleTabs } from "@/components/admin/inbox/LeadModuleTabs";
import { AdminDataTable } from "@/components/admin/table/AdminDataTable";
import type { ChipView, ColumnSpec, DataRow } from "@/components/admin/table/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { adminGet } from "@/lib/admin/adminApi";
import {
  ageParts,
  displayPhone,
  formatDhakaDateTime,
  formatPlainDate,
  initialsOf,
  whatsappHref,
} from "@/lib/admin/format";
import { assignLeads, markLeadsSpam } from "@/lib/admin/leadActions";
import { LEAD_VIEWS, leadListQuery, queueSearch, withSearch } from "@/lib/admin/queues";
import type { LeadList, LeadRow, StaffDirectoryEntry } from "@/lib/admin/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.leads");
  return { title: t("metaTitle") };
}

const PATH = "/secure-admin-control/leads";

async function Leads({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/leads">["searchParams"];
}) {
  const query = leadListQuery(await searchParams);
  const [list, staff, t, tc, tm, ts, tl, ta] = await Promise.all([
    // counts=1: open leads per module for the service tabs.
    adminGet<LeadList>("/admin/leads", { ...query, counts: "1" }),
    adminGet<StaffDirectoryEntry[]>("/admin/staff"),
    getTranslations("Admin.leads"),
    getTranslations("Admin.common"),
    getTranslations("Admin.modules"),
    getTranslations("Admin.statuses"),
    getTranslations("Admin.lead"),
    getTranslations("Admin.leadActions"),
  ]);
  // Each lead opens with this list beside it and Back to it (D0 R6).
  const search = queueSearch(query);
  const channel = (value: string) =>
    tl.has(`channels.${value}` as "channels.web")
      ? tl(`channels.${value}` as "channels.web")
      : value;
  const contactStrings = {
    call: t("call"),
    whatsapp: t("whatsapp"),
    logged: ta("done.contact"),
    failed: tc("unavailable"),
  };

  const ageOf = (row: LeadRow) => {
    const age = ageParts(row.ageMinutes);
    return age.unit === "minutes"
      ? t("ageMinutes", { minutes: age.value })
      : age.unit === "hours"
        ? t("ageHours", { hours: age.value })
        : t("ageDays", { days: age.value });
  };
  const rows: DataRow[] = list.items.map((row) => {
    const chips: ChipView[] = [
      { family: "lead", name: row.status, label: ts(row.status) },
      ...(row.overdue
        ? [
            {
              family: "overdue" as const,
              name: "overdue",
              label: t("views.overdue"),
              reason: ageOf(row),
            },
          ]
        : []),
    ];
    const travel = row.travelDate ? formatPlainDate(row.travelDate) : "";
    const contact = (
      <LeadContactButtons
        leadId={row.id}
        phone={row.phone}
        whatsappHref={whatsappHref(
          row.phone,
          tl("whatsappText", { name: row.name, reference: row.reference }),
        )}
        strings={contactStrings}
      />
    );
    return {
      id: row.id,
      href: withSearch(`${PATH}/${row.id}`, search),
      title: row.name,
      subtitle: [row.reference, tm(row.module), row.duplicateOf ? t("duplicate") : ""]
        .filter(Boolean)
        .join(" · "),
      thumb: { initials: initialsOf(row.name) },
      chips,
      facts: {
        trip: { text: row.summary },
        date: travel ? { text: travel, kind: "date" } : undefined,
        assignee: {
          text: row.assignee?.name ?? t("unassigned"),
          kind: row.assignee ? undefined : "muted",
        },
        age: { text: ageOf(row), kind: "date" },
        source: { text: channel(row.source), kind: "muted" },
      },
      summary: [
        { label: t("colReference"), value: row.reference },
        { label: t("module"), value: tm(row.module) },
        { label: t("colPhone"), value: displayPhone(row.phone) },
        ...(row.email ? [{ label: t("colEmail"), value: row.email }] : []),
        { label: t("colTrip"), value: row.summary },
        ...(travel ? [{ label: t("colDate"), value: travel }] : []),
        { label: t("colAssignee"), value: row.assignee?.name ?? t("unassigned") },
        { label: t("colAge"), value: `${ageOf(row)} (${formatDhakaDateTime(row.createdAt)})` },
        { label: t("colSource"), value: channel(row.source) },
      ],
      actions: <div className="flex flex-wrap gap-2">{contact}</div>,
      quick: contact,
    };
  });

  const columns: ColumnSpec[] = [
    { key: "name", label: t("colCustomer"), always: true },
    { key: "status", label: t("colStatus"), always: true },
    { key: "trip", label: t("colTrip") },
    { key: "date", label: t("colDate") },
    { key: "assignee", label: t("colAssignee") },
    { key: "age", label: t("colAge"), sort: "created" },
    { key: "source", label: t("colSource") },
  ];
  const exportSearch = queueSearch({
    view: query.view,
    module: query.module,
    status: query.status,
    q: query.q,
  });
  const tabLabels = {
    all: t("tabs.all"),
    ...Object.fromEntries(
      LeadModuleSchema.options.map((key) => [key, t(`tabs.${key}` as "tabs.all")]),
    ),
  } as Record<LeadModule, string> & { all: string };

  return (
    <>
      <AdminPageHeader
        title={t("title")}
        lead={t("lead", { sla: list.slaMinutes })}
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href={withSearch(`${PATH}/board`, queueSearch({ module: query.module }))}>
              <Columns3 aria-hidden="true" className="size-4" />
              {t("board")}
            </Link>
          </Button>
        }
      />
      <LeadModuleTabs
        path={PATH}
        current={query.module}
        modules={list.modules}
        keep={{ view: query.view === "all" ? undefined : query.view, q: query.q }}
        labels={tabLabels}
        openLabel={t("openCount", { count: "{count}" })}
        label={t("tabsLabel")}
      />
      <AdminDataTable
        listKey="leads"
        path={PATH}
        rows={rows}
        columns={columns}
        page={{ total: list.total, page: list.page, pageSize: list.pageSize }}
        searchLabel={t("searchPlaceholder")}
        filters={[
          {
            param: "view",
            label: t("show"),
            options: LEAD_VIEWS.filter((view) => view !== "all").map((view) => ({
              value: view,
              label: t(`views.${view}`),
            })),
          },
          {
            param: "status",
            label: t("status"),
            options: LeadStatusSchema.options.map((key) => ({ value: key, label: ts(key) })),
          },
        ]}
        bulk={[
          {
            id: "assign",
            label: t("bulkAssign"),
            choices: {
              label: t("assignTo"),
              options: [
                { value: "none", label: t("unassigned") },
                ...staff.map((person) => ({ value: person.id, label: person.name })),
              ],
            },
            run: assignLeads,
          },
          { id: "spam", label: t("bulkSpam"), danger: true, run: markLeadsSpam },
        ]}
        exportHref={withSearch(`${PATH}/export`, exportSearch)}
        openLabel={tc("open")}
        empty={
          // "No leads match" only when something narrows the list; an empty inbox says so plainly (D0 R10).
          query.q || query.status || query.module || query.view !== "all"
            ? { title: t("emptyTitle"), body: t("emptyBody") }
            : { title: t("emptyAllTitle"), body: t("emptyAllBody") }
        }
      />
    </>
  );
}

/** Leads (ADMIN.md §5.5): service tabs, the shared DataTable (D0 R5), each lead opening beside its list (R6). */
export default function LeadsPage(props: PageProps<"/[locale]/secure-admin-control/leads">) {
  return (
    <Suspense fallback={<Skeleton className="h-160 rounded-2xl" />}>
      <Leads searchParams={props.searchParams} />
    </Suspense>
  );
}
