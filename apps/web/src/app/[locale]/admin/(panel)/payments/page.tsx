import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ActionButton } from "@/components/admin/ActionButton";
import { AdminEmpty } from "@/components/admin/AdminEmpty";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { StatusTabs } from "@/components/admin/StatusTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGet, hasRole, requireStaff } from "@/lib/admin/adminApi";
import { displayPhone, formatDhakaDateTime, taka } from "@/lib/admin/format";
import { reviewProof } from "@/lib/admin/opsActions";
import type { Paged, ProofRow } from "@/lib/admin/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.proofs");
  return { title: t("metaTitle") };
}

const STATUSES = ["received", "verified", "rejected"] as const;
const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

async function Proofs({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/admin/payments">["searchParams"];
}) {
  const params = await searchParams;
  const status = STATUSES.find((item) => item === one(params.status)) ?? "received";
  const page = Math.max(1, Number(one(params.page)) || 1);
  const [staff, list, t, tc] = await Promise.all([
    requireStaff(),
    adminGet<Paged<ProofRow>>("/admin/payment-proofs", { status, page, pageSize: 20 }),
    getTranslations("Admin.proofs"),
    getTranslations("Admin.common"),
  ]);
  const canReview = hasRole(staff, "admin", "accounts");

  return (
    <>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <StatusTabs
        label={t("title")}
        current={status}
        items={STATUSES.map((value) => ({
          value,
          label: t(`statuses.${value}`),
          href: value === "received" ? "/admin/payments" : `/admin/payments?status=${value}`,
        }))}
      />
      <section className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
        {list.items.length === 0 ? (
          <AdminEmpty title={t("emptyTitle")} body={t("emptyBody")} />
        ) : (
          <ul className="divide-y divide-mist-100">
            {list.items.map((proof) => (
              <li
                key={proof.id}
                className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-mono text-[13.5px] font-semibold text-navy-900">
                    {proof.reference}
                  </p>
                  <p className="mt-0.5 font-semibold">
                    {proof.name} · <span className="tabular-nums">{displayPhone(proof.phone)}</span>
                  </p>
                  <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[14px]">
                    <div className="flex gap-1.5">
                      <dt className="text-mist-600">{t("amount")}</dt>
                      <dd className="font-semibold tabular-nums">{taka(proof.amount)}</dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="text-mist-600">{t("account")}</dt>
                      <dd>{proof.accountId}</dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="text-mist-600">{t("transaction")}</dt>
                      <dd className="font-mono">{proof.transactionId ?? "-"}</dd>
                    </div>
                  </dl>
                  <p className="mt-1 text-[13px] text-mist-600">
                    {proof.proof?.fileName
                      ? t("slip", { name: proof.proof.fileName })
                      : t("noSlip")}{" "}
                    · {formatDhakaDateTime(proof.createdAt)}
                  </p>
                </div>
                {canReview ? (
                  <div className="flex shrink-0 gap-2">
                    {proof.status !== "verified" ? (
                      <ActionButton
                        action={reviewProof.bind(null, proof.id, { status: "verified" })}
                        success={t("done")}
                        failed={tc("unavailable")}
                        variant="primary"
                      >
                        {t("verify")}
                      </ActionButton>
                    ) : null}
                    {proof.status !== "rejected" ? (
                      <ActionButton
                        action={reviewProof.bind(null, proof.id, { status: "rejected" })}
                        success={t("done")}
                        failed={tc("unavailable")}
                      >
                        {t("reject")}
                      </ActionButton>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <AdminPagination
          page={list.page}
          pageSize={list.pageSize}
          total={list.total}
          path="/admin/payments"
          query={{ status: status === "received" ? undefined : status }}
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

/** Offline payment proofs for Accounts (AdminPayments board, proofs queue). */
export default function PaymentsPage(props: PageProps<"/[locale]/admin/payments">) {
  return (
    <Suspense fallback={<Skeleton className="h-[560px] rounded-2xl" />}>
      <Proofs searchParams={props.searchParams} />
    </Suspense>
  );
}
