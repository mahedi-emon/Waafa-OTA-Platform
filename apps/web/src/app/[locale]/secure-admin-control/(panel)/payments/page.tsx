import { Suspense } from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { AdminEmpty } from "@/components/admin/AdminEmpty";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ProofDecision } from "@/components/admin/ProofDecision";
import { StatusChip } from "@/components/admin/StatusChip";
import { StatusTabs } from "@/components/admin/StatusTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { pickMessagePaths } from "@/i18n/pickMessages";
import { Link } from "@/i18n/navigation";
import { adminGet, hasRole, requireStaff } from "@/lib/admin/adminApi";
import { displayPhone, formatDhakaDateTime, taka, pageParam } from "@/lib/admin/format";
import { PROOF_CHIPS } from "@/lib/admin/statusChips";
import type { Paged, ProofRow } from "@/lib/admin/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.proofs");
  return { title: t("metaTitle") };
}

/** "To verify" holds received and matched proofs (D0 R4). */
const STATUSES = ["received", "verified", "rejected"] as const;
/** Only the decision buttons' words reach the browser (scoped provider, D190). */
const PROOF_MESSAGES = ["Admin.proofDecision"];
const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

async function Proofs({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/payments">["searchParams"];
}) {
  const params = await searchParams;
  const status = STATUSES.find((item) => item === one(params.status)) ?? "received";
  const page = pageParam(params.page);
  const [staff, list, t, tc, messages] = await Promise.all([
    requireStaff(),
    adminGet<Paged<ProofRow>>("/admin/payment-proofs", { status, page, pageSize: 20 }),
    getTranslations("Admin.proofs"),
    getTranslations("Admin.common"),
    getMessages(),
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
          href:
            value === "received"
              ? "/secure-admin-control/payments"
              : `/secure-admin-control/payments?status=${value}`,
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
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[13.5px] font-semibold text-navy-900">
                      {proof.reference}
                    </span>
                    <StatusChip
                      size="sm"
                      tone={PROOF_CHIPS[proof.status].tone}
                      icon={PROOF_CHIPS[proof.status].icon}
                      label={t(`statuses.${proof.status}`)}
                      {...(proof.decidedBy
                        ? {
                            reason: t("decided", {
                              status: t(`statuses.${proof.status}`),
                              name: proof.decidedBy,
                            }),
                          }
                        : {})}
                    />
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
                  <p className="mt-1.5 text-[13.5px]">
                    {proof.order ? (
                      <>
                        <span
                          className={
                            proof.amount >= proof.order.total
                              ? "font-medium text-success-700"
                              : "font-medium text-warning-800"
                          }
                        >
                          {proof.amount >= proof.order.total
                            ? t("matchedOrder", {
                                reference: proof.order.reference,
                                amount: taka(proof.order.total),
                              })
                            : t("orderShort", {
                                reference: proof.order.reference,
                                amount: taka(proof.order.total - proof.amount),
                              })}
                        </span>{" "}
                        <Link
                          href={`/secure-admin-control/orders/${proof.order.id}`}
                          prefetch={false}
                          className="inline-flex min-h-11 items-center font-semibold text-brand-700 hover:underline"
                        >
                          {t("openOrder")}
                        </Link>
                      </>
                    ) : (
                      <span className="text-mist-600">{t("noOrder")}</span>
                    )}
                  </p>
                  {proof.status === "rejected" && proof.note ? (
                    <p className="mt-1 text-[13.5px] text-danger-700">{proof.note}</p>
                  ) : null}
                </div>
                {canReview && (proof.status === "received" || proof.status === "matched") ? (
                  <NextIntlClientProvider messages={pickMessagePaths(messages, PROOF_MESSAGES)}>
                    <ProofDecision id={proof.id} reference={proof.reference} />
                  </NextIntlClientProvider>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <AdminPagination
          page={list.page}
          pageSize={list.pageSize}
          total={list.total}
          path="/secure-admin-control/payments"
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
export default function PaymentsPage(props: PageProps<"/[locale]/secure-admin-control/payments">) {
  return (
    <Suspense fallback={<Skeleton className="h-[560px] rounded-2xl" />}>
      <Proofs searchParams={props.searchParams} />
    </Suspense>
  );
}
