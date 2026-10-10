import { Suspense } from "react";
import type { Metadata } from "next";
import { Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ActionButton } from "@/components/admin/ActionButton";
import { AdminEmpty } from "@/components/admin/AdminEmpty";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { StatusTabs } from "@/components/admin/StatusTabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGet } from "@/lib/admin/adminApi";
import { displayPhone, formatDhakaDateTime, pageParam } from "@/lib/admin/format";
import { moderateFeedback } from "@/lib/admin/opsActions";
import type { FeedbackRow, Paged } from "@/lib/admin/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.feedback");
  return { title: t("metaTitle") };
}

const STATUSES = ["pending", "approved", "rejected"] as const;
const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

async function Feedback({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/admin/feedback">["searchParams"];
}) {
  const params = await searchParams;
  const status = STATUSES.find((item) => item === one(params.status)) ?? "pending";
  const page = pageParam(params.page);
  const [list, t, tc] = await Promise.all([
    adminGet<Paged<FeedbackRow>>("/admin/feedback", { status, page, pageSize: 20 }),
    getTranslations("Admin.feedback"),
    getTranslations("Admin.common"),
  ]);

  return (
    <>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <StatusTabs
        label={t("title")}
        current={status}
        items={STATUSES.map((value) => ({
          value,
          label: t(`statuses.${value}`),
          href: value === "pending" ? "/admin/feedback" : `/admin/feedback?status=${value}`,
        }))}
      />
      <section className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
        {list.items.length === 0 ? (
          <AdminEmpty title={t("emptyTitle")} body={t("emptyBody")} />
        ) : (
          <ul className="divide-y divide-mist-100">
            {list.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 p-5 md:flex-row md:items-start md:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-navy-900">{item.name}</p>
                    <Badge variant="outline">{item.service}</Badge>
                    {item.rating ? (
                      <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-gold-700">
                        <Star aria-hidden="true" className="size-3.5 fill-current" />
                        {t("rating", { stars: item.rating })}
                      </span>
                    ) : null}
                    {!item.consentToPublish ? (
                      <Badge variant="warning">{t("noConsent")}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-[15px] whitespace-pre-line text-ink-900">
                    {item.comment}
                  </p>
                  <p className="mt-2 text-[13px] text-mist-600">
                    {displayPhone(item.phone)} · {formatDhakaDateTime(item.createdAt)}
                    {item.reference ? ` · ${t("reference", { reference: item.reference })}` : ""}
                    {item.moderatedBy ? ` · ${tc("by", { name: item.moderatedBy })}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
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
              </li>
            ))}
          </ul>
        )}
        <AdminPagination
          page={list.page}
          pageSize={list.pageSize}
          total={list.total}
          path="/admin/feedback"
          query={{ status: status === "pending" ? undefined : status }}
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

/** Feedback moderation (AdminFeedback board). */
export default function FeedbackPage(props: PageProps<"/[locale]/admin/feedback">) {
  return (
    <Suspense fallback={<Skeleton className="h-[560px] rounded-2xl" />}>
      <Feedback searchParams={props.searchParams} />
    </Suspense>
  );
}
