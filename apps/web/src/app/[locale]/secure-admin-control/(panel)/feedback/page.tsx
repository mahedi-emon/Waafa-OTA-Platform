import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ActionButton } from "@/components/admin/ActionButton";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusTabs } from "@/components/admin/StatusTabs";
import { AdminDataTable } from "@/components/admin/table/AdminDataTable";
import { pageSizeOf, sortOf } from "@/components/admin/table/listQuery";
import type { ChipView, ColumnSpec, DataRow } from "@/components/admin/table/types";
import { customerFileHref } from "@/components/admin/files/CustomerFiles";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGet } from "@/lib/admin/adminApi";
import { displayPhone, formatDhakaDateTime, initialsOf, pageParam } from "@/lib/admin/format";
import { moderateFeedback, moderateFeedbackMany } from "@/lib/admin/opsActions";
import type { FeedbackRow, Paged } from "@/lib/admin/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.feedback");
  return { title: t("metaTitle") };
}

const STATUSES = ["pending", "approved", "rejected"] as const;
const SORTS = ["created.asc", "created.desc"] as const;
const PATH = "/secure-admin-control/feedback";
const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

async function Feedback({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/feedback">["searchParams"];
}) {
  const params = await searchParams;
  const status = STATUSES.find((item) => item === one(params.status)) ?? "pending";
  const q = one(params.q)?.slice(0, 80);
  const sort = sortOf(params.sort, SORTS);
  const [list, t, tc, tf] = await Promise.all([
    adminGet<Paged<FeedbackRow>>("/admin/feedback", {
      status,
      page: pageParam(params.page),
      pageSize: pageSizeOf(params.pageSize),
      ...(q ? { q } : {}),
      ...(sort ? { sort } : {}),
    }),
    getTranslations("Admin.feedback"),
    getTranslations("Admin.common"),
    getTranslations("Admin.files"),
  ]);

  const rows: DataRow[] = list.items.map((item) => {
    const received = formatDhakaDateTime(item.createdAt);
    const chips: ChipView[] = [
      {
        family: "feedback",
        name: item.status,
        label: t(`statuses.${item.status}`),
        ...(item.moderatedBy ? { reason: tc("by", { name: item.moderatedBy }) } : {}),
      },
      ...(!item.consentToPublish
        ? [{ family: "feedback" as const, name: "noConsent", label: t("noConsent") }]
        : []),
    ];
    return {
      id: item.id,
      title: item.name,
      subtitle: [item.service, item.rating ? t("rating", { stars: item.rating }) : ""]
        .filter(Boolean)
        .join(" · "),
      thumb: { initials: initialsOf(item.name) },
      chips,
      facts: {
        comment: { text: item.comment },
        received: { text: received, kind: "date" },
      },
      summary: [
        { label: t("colComment"), value: item.comment },
        { label: t("colPhone"), value: displayPhone(item.phone) },
        ...(item.reference ? [{ label: t("colReference"), value: item.reference }] : []),
        { label: t("colReceived"), value: received },
      ],
      actions: (
        <div className="flex flex-wrap gap-2">
          {item.photo?.storageKey ? (
            <Button asChild variant="secondary" size="md">
              <a
                href={customerFileHref(item.photo.storageKey)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {tf("openPhoto")}
              </a>
            </Button>
          ) : null}
          {item.status !== "approved" && item.consentToPublish ? (
            <ActionButton
              action={moderateFeedback.bind(null, item.id, { status: "approved" })}
              success={t("done")}
              failed={tc("unavailable")}
              variant="primary"
            >
              {t("approve")}
            </ActionButton>
          ) : null}
          {item.status !== "rejected" ? (
            <ActionButton
              action={moderateFeedback.bind(null, item.id, { status: "rejected" })}
              success={t("done")}
              failed={tc("unavailable")}
            >
              {t("reject")}
            </ActionButton>
          ) : null}
          {item.status !== "pending" ? (
            <ActionButton
              action={moderateFeedback.bind(null, item.id, { status: "pending" })}
              success={t("done")}
              failed={tc("unavailable")}
              variant="ghost"
            >
              {t("backToReview")}
            </ActionButton>
          ) : null}
        </div>
      ),
    };
  });

  const columns: ColumnSpec[] = [
    { key: "name", label: t("colName"), always: true },
    { key: "status", label: t("colStatus"), always: true },
    { key: "comment", label: t("colComment") },
    { key: "received", label: t("colReceived"), sort: "created" },
  ];

  return (
    <>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <StatusTabs
        label={t("title")}
        current={status}
        items={STATUSES.map((value) => ({
          value,
          label: t(`statuses.${value}`),
          href: value === "pending" ? PATH : `${PATH}?status=${value}`,
        }))}
      />
      <AdminDataTable
        listKey="feedback"
        path={PATH}
        rows={rows}
        columns={columns}
        page={{ total: list.total, page: list.page, pageSize: list.pageSize }}
        searchLabel={t("search")}
        bulk={[
          ...(status !== "approved"
            ? [
                {
                  id: "approve",
                  label: t("approve"),
                  run: moderateFeedbackMany.bind(null, "approved"),
                },
              ]
            : []),
          ...(status !== "rejected"
            ? [
                {
                  id: "reject",
                  label: t("reject"),
                  run: moderateFeedbackMany.bind(null, "rejected"),
                },
              ]
            : []),
        ]}
        openLabel={tc("open")}
        empty={{ title: t("emptyTitle"), body: t("emptyBody") }}
      />
    </>
  );
}

/** Feedback moderation (AdminFeedback board) on the shared DataTable (D0 R5). */
export default function FeedbackPage(props: PageProps<"/[locale]/secure-admin-control/feedback">) {
  return (
    <Suspense fallback={<Skeleton className="h-140 rounded-2xl" />}>
      <Feedback searchParams={props.searchParams} />
    </Suspense>
  );
}
