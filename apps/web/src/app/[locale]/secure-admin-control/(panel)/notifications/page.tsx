import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
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
import { adminGet } from "@/lib/admin/adminApi";
import { formatDhakaDateTime, pageParam } from "@/lib/admin/format";
import type { NotificationRow, Paged } from "@/lib/admin/types";
import { SettingsFrame, settingsTitles } from "@/components/admin/settings/SettingsFrame";
import { SettingsSectionTabs } from "@/components/admin/settings/SettingsSectionTabs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.notifications");
  return { title: t("metaTitle") };
}

async function Log({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/notifications">["searchParams"];
}) {
  const params = await searchParams;
  const page = pageParam(params.page);
  const [list, t, tc, titles, ts] = await Promise.all([
    adminGet<Paged<NotificationRow>>("/admin/notifications", { page, pageSize: 40 }),
    getTranslations("Admin.notifications"),
    getTranslations("Admin.common"),
    settingsTitles(),
    getTranslations("Admin.settingsIndex"),
  ]);
  return (
    <SettingsFrame current="forms">
      <AdminPageHeader title={titles.forms} lead={ts("sections.forms.body")} />
      <SettingsSectionTabs section="forms" current="sent" sectionTitle={titles.forms} />
      <p className="mb-4 text-[14.5px] text-mist-600">{t("lead")}</p>
      <section className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t("colWhen")}</TableHead>
              <TableHead>{t("colTo")}</TableHead>
              <TableHead>{t("colTemplate")}</TableHead>
              <TableHead>{t("colSubject")}</TableHead>
              <TableHead>{t("colStatus")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.items.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-[13px] whitespace-nowrap text-mist-600">
                  {formatDhakaDateTime(row.createdAt)}
                </TableCell>
                <TableCell className="break-all">{row.recipient}</TableCell>
                <TableCell className="font-mono text-[12.5px]">{row.template}</TableCell>
                <TableCell className="max-w-[320px]">{row.subject}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      row.status === "sent"
                        ? "success"
                        : row.status === "failed"
                          ? "danger"
                          : "neutral"
                    }
                  >
                    {row.status}
                  </Badge>
                  {row.error ? (
                    <p className="mt-1 text-[12px] text-danger-600">{row.error}</p>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <AdminPagination
          page={list.page}
          pageSize={list.pageSize}
          total={list.total}
          path="/secure-admin-control/notifications"
          query={{}}
          strings={{
            previous: tc("previous"),
            next: tc("next"),
            summary: tc("showing", { shown: list.items.length, total: list.total }),
          }}
        />
      </section>
    </SettingsFrame>
  );
}

/** Email delivery log (AdminNotify board, log part). */
export default function NotificationsPage(
  props: PageProps<"/[locale]/secure-admin-control/notifications">,
) {
  return (
    <Suspense fallback={<Skeleton className="h-[480px] rounded-2xl" />}>
      <Log searchParams={props.searchParams} />
    </Suspense>
  );
}
