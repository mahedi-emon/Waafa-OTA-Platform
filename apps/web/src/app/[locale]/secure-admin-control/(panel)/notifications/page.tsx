import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SettingsFrame, settingsTitles } from "@/components/admin/settings/SettingsFrame";
import { SettingsSectionTabs } from "@/components/admin/settings/SettingsSectionTabs";
import { AdminDataTable } from "@/components/admin/table/AdminDataTable";
import { pageSizeOf } from "@/components/admin/table/listQuery";
import type { ColumnSpec, DataRow } from "@/components/admin/table/types";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGet } from "@/lib/admin/adminApi";
import { formatDhakaDateTime, pageParam } from "@/lib/admin/format";
import type { NotificationRow, Paged } from "@/lib/admin/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.notifications");
  return { title: t("metaTitle") };
}

const PATH = "/secure-admin-control/notifications";
const STATUSES = ["queued", "sent", "failed"] as const;
const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

async function Log({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/notifications">["searchParams"];
}) {
  const params = await searchParams;
  const q = one(params.q)?.slice(0, 80);
  const [list, t, tc, titles, ts, tk] = await Promise.all([
    adminGet<Paged<NotificationRow>>("/admin/notifications", {
      page: pageParam(params.page),
      pageSize: pageSizeOf(params.pageSize),
      ...(q ? { q } : {}),
    }),
    getTranslations("Admin.notifications"),
    getTranslations("Admin.common"),
    settingsTitles(),
    getTranslations("Admin.settingsIndex"),
    getTranslations("Admin.choices"),
  ]);
  // Template names are looked up by the stored key, so this translator is used untyped.
  const keys = tk as unknown as ((key: string) => string) & { has: (key: string) => boolean };
  const templateName = (key: string) =>
    keys.has(`templateKey.${key}`) ? keys(`templateKey.${key}`) : t("otherTemplate");

  const rows: DataRow[] = list.items.map((row) => {
    const when = formatDhakaDateTime(row.createdAt);
    const status = STATUSES.find((item) => item === row.status) ?? "queued";
    return {
      id: row.id,
      title: row.subject,
      subtitle: row.recipient,
      chips: [
        {
          family: "email",
          name: status,
          label: t(`statuses.${status}`),
          ...(row.error ? { reason: row.error } : {}),
        },
      ],
      facts: {
        to: { text: row.recipient },
        template: { text: templateName(row.template), kind: "muted" },
        when: { text: when, kind: "date" },
      },
      summary: [
        { label: t("colTo"), value: row.recipient },
        { label: t("colTemplate"), value: templateName(row.template) },
        { label: t("colWhen"), value: when },
        ...(row.sentAt ? [{ label: t("colSent"), value: formatDhakaDateTime(row.sentAt) }] : []),
        { label: t("colAttempts"), value: String(row.attempts) },
        ...(row.error ? [{ label: t("colError"), value: row.error }] : []),
      ],
    };
  });

  const columns: ColumnSpec[] = [
    { key: "name", label: t("colSubject"), always: true },
    { key: "status", label: t("colStatus"), always: true },
    { key: "to", label: t("colTo") },
    { key: "template", label: t("colTemplate") },
    { key: "when", label: t("colWhen") },
  ];

  return (
    <SettingsFrame current="forms">
      <AdminPageHeader title={titles.forms} lead={ts("sections.forms.body")} />
      <SettingsSectionTabs section="forms" current="sent" sectionTitle={titles.forms} />
      <p className="mb-4 text-[14.5px] text-mist-600">{t("lead")}</p>
      <AdminDataTable
        listKey="notifications"
        path={PATH}
        rows={rows}
        columns={columns}
        page={{ total: list.total, page: list.page, pageSize: list.pageSize }}
        searchLabel={t("search")}
        openLabel={tc("open")}
        empty={{ title: t("emptyTitle"), body: t("emptyBody") }}
      />
    </SettingsFrame>
  );
}

/** Sent messages (AdminNotify board, log part) on the shared DataTable (issue 229). */
export default function NotificationsPage(
  props: PageProps<"/[locale]/secure-admin-control/notifications">,
) {
  return (
    <Suspense fallback={<Skeleton className="h-[480px] rounded-2xl" />}>
      <Log searchParams={props.searchParams} />
    </Suspense>
  );
}
