import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { VisaStage } from "@waafa/shared";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { LeadContactButtons } from "@/components/admin/inbox/LeadContactButtons";
import { AdminDataTable } from "@/components/admin/table/AdminDataTable";
import type { ChipView, ColumnSpec, DataRow } from "@/components/admin/table/types";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGet } from "@/lib/admin/adminApi";
import {
  ageParts,
  displayPhone,
  formatDhakaDateTime,
  formatPlainDate,
  initialsOf,
  whatsappHref,
} from "@/lib/admin/format";
import { assignLeads } from "@/lib/admin/leadActions";
import {
  queueSearch,
  VISA_STAGES,
  VISA_VIEWS,
  visaListQuery,
  withSearch,
} from "@/lib/admin/queues";
import type { StaffDirectoryEntry, VisaApplicationList } from "@/lib/admin/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.visaApplications");
  return { title: t("metaTitle") };
}

const PATH = "/secure-admin-control/visa-applications";
const LEADS = "/secure-admin-control/leads";

async function VisaApplications({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/visa-applications">["searchParams"];
}) {
  const query = visaListQuery(await searchParams);
  const [list, staff, t, tc, tv, tl, tlead, ta] = await Promise.all([
    adminGet<VisaApplicationList>("/admin/visa-applications", query),
    adminGet<StaffDirectoryEntry[]>("/admin/staff"),
    getTranslations("Admin.visaApplications"),
    getTranslations("Admin.common"),
    getTranslations("Admin.visaProgress"),
    getTranslations("Admin.leads"),
    getTranslations("Admin.lead"),
    getTranslations("Admin.leadActions"),
  ]);
  // Each application opens on its lead page with this list beside it (D0 R6).
  const search = queueSearch({ queue: "visa", ...query });
  const stageName = (stage: VisaStage) => tv(`stages.${stage}`);
  const ageOf = (minutes: number) => {
    const age = ageParts(minutes);
    return age.unit === "minutes"
      ? tl("ageMinutes", { minutes: age.value })
      : age.unit === "hours"
        ? tl("ageHours", { hours: age.value })
        : tl("ageDays", { days: age.value });
  };
  const contactStrings = {
    call: tl("call"),
    whatsapp: tl("whatsapp"),
    logged: ta("done.contact"),
    failed: tc("unavailable"),
  };

  const rows: DataRow[] = list.items.map((item) => {
    const documents = tv("progress", { received: item.received, required: item.required });
    const reason =
      item.stage === "documentsPending"
        ? tv("stageReasons.documentsPending", { received: item.received, required: item.required })
        : item.stage === "submitted"
          ? tv("stageReasons.submitted", { date: formatPlainDate(item.submittedOn) })
          : item.stage === "passportReturned"
            ? stageName(item.stage)
            : tv(`stageReasons.${item.stage}` as "stageReasons.readyToSubmit");
    const chips: ChipView[] = [
      { family: "visa", name: item.stage, label: stageName(item.stage), reason },
      ...(item.overdue
        ? [{ family: "overdue" as const, name: "overdue", label: tl("views.overdue") }]
        : []),
    ];
    const travel = item.travelDate ? formatPlainDate(item.travelDate) : "";
    const contact = (
      <LeadContactButtons
        leadId={item.id}
        phone={item.phone}
        whatsappHref={whatsappHref(
          item.phone,
          tlead("whatsappText", { name: item.name, reference: item.reference }),
        )}
        strings={contactStrings}
      />
    );
    return {
      id: item.id,
      href: withSearch(`${LEADS}/${item.id}`, search),
      title: item.name,
      subtitle: [item.reference, item.country ?? ""].filter(Boolean).join(" · "),
      thumb: { initials: initialsOf(item.name) },
      chips,
      facts: {
        documents: item.required > 0 ? { text: documents, kind: "money" } : undefined,
        travel: travel ? { text: travel, kind: "date" } : undefined,
        assignee: {
          text: item.assignee?.name ?? tl("unassigned"),
          kind: item.assignee ? undefined : "muted",
        },
        received: { text: ageOf(item.ageMinutes), kind: "date" },
        submitted: item.submittedOn
          ? { text: formatPlainDate(item.submittedOn), kind: "date" }
          : undefined,
      },
      summary: [
        { label: tl("colReference"), value: item.reference },
        ...(item.country ? [{ label: t("colCountry"), value: item.country }] : []),
        { label: t("colStage"), value: `${stageName(item.stage)} · ${reason}` },
        ...(item.required > 0 ? [{ label: t("colDocuments"), value: documents }] : []),
        { label: tl("colPhone"), value: displayPhone(item.phone) },
        ...(travel ? [{ label: t("colTravel"), value: travel }] : []),
        { label: t("colAssignee"), value: item.assignee?.name ?? tl("unassigned") },
        { label: t("colReceived"), value: formatDhakaDateTime(item.createdAt) },
      ],
      actions: <div className="flex flex-wrap gap-2">{contact}</div>,
      quick: contact,
    };
  });

  const columns: ColumnSpec[] = [
    { key: "name", label: t("colApplicant"), always: true },
    { key: "status", label: t("colStage"), always: true },
    { key: "documents", label: t("colDocuments"), align: "end" },
    { key: "travel", label: t("colTravel") },
    { key: "assignee", label: t("colAssignee") },
    { key: "received", label: t("colReceived"), sort: "created" },
    { key: "submitted", label: t("colSubmitted") },
  ];

  return (
    <>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <AdminDataTable
        listKey="visa-applications"
        path={PATH}
        rows={rows}
        columns={columns}
        page={{ total: list.total, page: list.page, pageSize: list.pageSize }}
        searchLabel={t("search")}
        filters={[
          {
            param: "stage",
            label: t("colStage"),
            options: VISA_STAGES.map((stage) => ({
              value: stage,
              label: t("stageCount", { stage: stageName(stage), count: list.stages[stage] ?? 0 }),
            })),
          },
          {
            param: "view",
            label: tl("show"),
            options: VISA_VIEWS.filter((view) => view !== "all").map((view) => ({
              value: view,
              label: tl(`views.${view}`),
            })),
          },
        ]}
        bulk={[
          {
            id: "assign",
            label: tl("bulkAssign"),
            choices: {
              label: tl("assignTo"),
              options: [
                { value: "none", label: tl("unassigned") },
                ...staff.map((person) => ({ value: person.id, label: person.name })),
              ],
            },
            run: assignLeads,
          },
        ]}
        openLabel={tc("open")}
        empty={{ title: t("emptyTitle"), body: t("emptyBody") }}
      />
    </>
  );
}

/** Visa applications (ADMIN.md §8.3, D0 R6): visa requests by checklist stage; each opens on its lead page. */
export default function VisaApplicationsPage(
  props: PageProps<"/[locale]/secure-admin-control/visa-applications">,
) {
  return (
    <Suspense fallback={<Skeleton className="h-160 rounded-2xl" />}>
      <VisaApplications searchParams={props.searchParams} />
    </Suspense>
  );
}
