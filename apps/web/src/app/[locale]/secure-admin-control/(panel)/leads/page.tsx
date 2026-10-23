import { Suspense } from "react";
import type { Metadata } from "next";
import { Columns3, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LeadModuleSchema, LeadStatusSchema } from "@waafa/shared";
import { cn } from "cn";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminDataTable } from "@/components/admin/table/AdminDataTable";
import { pageSizeOf, sortOf } from "@/components/admin/table/listQuery";
import type { ChipView, ColumnSpec, DataRow } from "@/components/admin/table/types";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
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
  pageParam,
  whatsappHref,
} from "@/lib/admin/format";
import { assignLeads, markLeadsSpam } from "@/lib/admin/leadActions";
import type { LeadList, LeadRow, StaffDirectoryEntry } from "@/lib/admin/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.leads");
  return { title: t("metaTitle") };
}

const VIEWS = ["all", "open", "mine", "unassigned", "overdue"] as const;
type View = (typeof VIEWS)[number];
const SORTS = ["created.asc", "created.desc"] as const;
const PATH = "/secure-admin-control/leads";

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/** Call and WhatsApp, the first step with almost every lead. */
function ContactButtons({ row, call, whatsapp }: { row: LeadRow; call: string; whatsapp: string }) {
  return (
    <>
      <Button asChild variant="secondary" size="sm">
        <a href={`tel:${row.phone}`}>
          <Phone aria-hidden="true" className="size-4" />
          {call}
        </a>
      </Button>
      <Button asChild variant="whatsapp" size="sm">
        <a href={whatsappHref(row.phone, row.reference)} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon className="size-4" />
          {whatsapp}
        </a>
      </Button>
    </>
  );
}

async function Leads({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/leads">["searchParams"];
}) {
  const params = await searchParams;
  const view: View = VIEWS.find((item) => item === one(params.view)) ?? "all";
  const query = {
    view,
    module: LeadModuleSchema.safeParse(one(params.module)).data,
    status: LeadStatusSchema.safeParse(one(params.status)).data,
    q: one(params.q)?.slice(0, 80),
    sort: sortOf(params.sort, SORTS),
    page: pageParam(params.page),
    pageSize: pageSizeOf(params.pageSize),
  };
  const [list, staff, t, tc, tm, ts] = await Promise.all([
    adminGet<LeadList>("/admin/leads", query),
    adminGet<StaffDirectoryEntry[]>("/admin/staff"),
    getTranslations("Admin.leads"),
    getTranslations("Admin.common"),
    getTranslations("Admin.modules"),
    getTranslations("Admin.statuses"),
  ]);

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
    return {
      id: row.id,
      href: `${PATH}/${row.id}`,
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
        source: { text: row.source, kind: "muted" },
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
        { label: t("colSource"), value: row.source },
      ],
      actions: (
        <div className="flex flex-wrap gap-2">
          <ContactButtons row={row} call={t("call")} whatsapp={t("whatsapp")} />
        </div>
      ),
      quick: <ContactButtons row={row} call={t("call")} whatsapp={t("whatsapp")} />,
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
  const exportQuery = new URLSearchParams(
    Object.entries({
      view: view === "all" ? undefined : view,
      module: query.module,
      status: query.status,
      q: query.q,
    }).filter((entry): entry is [string, string] => Boolean(entry[1])),
  ).toString();
  const viewHref = (item: View) => {
    const next = new URLSearchParams(exportQuery);
    if (item === "all") next.delete("view");
    else next.set("view", item);
    const search = next.toString();
    return search ? `${PATH}?${search}` : PATH;
  };

  return (
    <>
      <AdminPageHeader
        title={t("title")}
        lead={t("lead", { sla: list.slaMinutes })}
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href={`${PATH}/board`}>
              <Columns3 aria-hidden="true" className="size-4" />
              {t("board")}
            </Link>
          </Button>
        }
      />
      <nav aria-label={t("title")} className="-mx-1 mb-4 flex gap-1 overflow-x-auto px-1 pb-1">
        {VIEWS.map((item) => (
          <Link
            key={item}
            href={viewHref(item)}
            prefetch={false}
            aria-current={item === view ? "page" : undefined}
            className={cn(
              "flex min-h-11 shrink-0 items-center rounded-full px-4 text-[14.5px] font-semibold transition-colors duration-150",
              item === view
                ? "bg-navy-900 text-white"
                : "bg-white text-navy-900 ring-1 ring-mist-200 hover:bg-mist-50",
            )}
          >
            {t(`views.${item}`)}
          </Link>
        ))}
      </nav>
      <AdminDataTable
        listKey="leads"
        path={PATH}
        rows={rows}
        columns={columns}
        page={{ total: list.total, page: list.page, pageSize: list.pageSize }}
        searchLabel={t("searchPlaceholder")}
        filters={[
          {
            param: "module",
            label: t("module"),
            options: LeadModuleSchema.options.map((key) => ({ value: key, label: tm(key) })),
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
        exportHref={`${PATH}/export${exportQuery ? `?${exportQuery}` : ""}`}
        openLabel={tc("open")}
        empty={{ title: t("emptyTitle"), body: t("emptyBody") }}
      />
    </>
  );
}

/** Leads (AdminLeads, AdminLeads-bulk, AdminLeads-m boards) on the shared DataTable (D0 R5). */
export default function LeadsPage(props: PageProps<"/[locale]/secure-admin-control/leads">) {
  return (
    <Suspense fallback={<Skeleton className="h-160 rounded-2xl" />}>
      <Leads searchParams={props.searchParams} />
    </Suspense>
  );
}
