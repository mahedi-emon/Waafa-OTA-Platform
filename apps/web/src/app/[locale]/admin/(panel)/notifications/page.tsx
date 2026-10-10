import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { adminGet } from "@/lib/admin/adminApi";
import { formatDhakaDateTime, pageParam } from "@/lib/admin/format";
import type { NotificationRow, Paged } from "@/lib/admin/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.notifications");
  return { title: t("metaTitle") };
}

async function Log({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/admin/notifications">["searchParams"];
}) {
  const params = await searchParams;
  const page = pageParam(params.page);
  const [list, t, tc] = await Promise.all([
    adminGet<Paged<NotificationRow>>("/admin/notifications", { page, pageSize: 40 }),
    getTranslations("Admin.notifications"),
    getTranslations("Admin.common"),
  ]);
  return (
    <>
      <AdminPageHeader
        title={t("title")}
        lead={t("lead")}
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href="/admin/content/notificationTemplates" prefetch={false}>
              {t("templates")}
            </Link>
          </Button>
        }
      />
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
          path="/admin/notifications"
          query={{}}
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

/** Email delivery log (AdminNotify board, log part). */
export default function NotificationsPage(props: PageProps<"/[locale]/admin/notifications">) {
  return (
    <Suspense fallback={<Skeleton className="h-[480px] rounded-2xl" />}>
      <Log searchParams={props.searchParams} />
    </Suspense>
  );
}
