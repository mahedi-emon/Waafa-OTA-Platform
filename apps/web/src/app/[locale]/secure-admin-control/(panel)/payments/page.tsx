import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProofDecision } from "@/components/admin/ProofDecision";
import { StatusTabs } from "@/components/admin/StatusTabs";
import { AdminDataTable } from "@/components/admin/table/AdminDataTable";
import { pageSizeOf, sortOf } from "@/components/admin/table/listQuery";
import type { ColumnSpec, DataRow } from "@/components/admin/table/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { adminGet, hasRole, requireStaff } from "@/lib/admin/adminApi";
import { displayPhone, formatDhakaDateTime, initialsOf, pageParam, taka } from "@/lib/admin/format";
import type { Paged, ProofRow } from "@/lib/admin/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.proofs");
  return { title: t("metaTitle") };
}

/** "To verify" holds received and matched proofs (D0 R4). */
const STATUSES = ["received", "verified", "rejected"] as const;
const SORTS = ["created.asc", "created.desc", "amount.asc", "amount.desc"] as const;
const PATH = "/secure-admin-control/payments";
/** Only the decision buttons' words reach the browser with the table's (scoped provider, D190). */
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
  const q = one(params.q)?.slice(0, 80);
  const sort = sortOf(params.sort, SORTS);
  const [staff, list, t, tc] = await Promise.all([
    requireStaff(),
    adminGet<Paged<ProofRow>>("/admin/payment-proofs", {
      status,
      page: pageParam(params.page),
      pageSize: pageSizeOf(params.pageSize),
      ...(q ? { q } : {}),
      ...(sort ? { sort } : {}),
    }),
    getTranslations("Admin.proofs"),
    getTranslations("Admin.common"),
  ]);
  const canReview = hasRole(staff, "admin", "accounts");

  const rows: DataRow[] = list.items.map((proof) => {
    const received = formatDhakaDateTime(proof.createdAt);
    const covers = proof.order ? proof.amount >= proof.order.total : false;
    const orderWords = proof.order
      ? covers
        ? t("matchedOrder", { reference: proof.order.reference, amount: taka(proof.order.total) })
        : t("orderShort", {
            reference: proof.order.reference,
            amount: taka(proof.order.total - proof.amount),
          })
      : t("noOrder");
    const decided = proof.decidedBy
      ? t("decided", { status: t(`statuses.${proof.status}`), name: proof.decidedBy })
      : undefined;
    return {
      id: proof.id,
      title: proof.name,
      subtitle: `${proof.reference} · ${displayPhone(proof.phone)}`,
      thumb: { initials: initialsOf(proof.name) },
      chips: [
        {
          family: "proof",
          name: proof.status,
          label: t(`statuses.${proof.status}`),
          ...(decided ? { reason: decided } : {}),
        },
      ],
      facts: {
        amount: { text: taka(proof.amount), kind: "money" },
        account: { text: proof.accountId, kind: "muted" },
        order: { text: orderWords, kind: proof.order ? undefined : "muted" },
        received: { text: received, kind: "date" },
      },
      summary: [
        { label: t("amount"), value: taka(proof.amount) },
        { label: t("account"), value: proof.accountId },
        { label: t("transaction"), value: proof.transactionId ?? "-" },
        { label: t("colOrder"), value: orderWords },
        {
          label: t("colSlip"),
          value: proof.proof?.fileName ? t("slip", { name: proof.proof.fileName }) : t("noSlip"),
        },
        { label: t("colReceived"), value: received },
        ...(proof.status === "rejected" && proof.note
          ? [{ label: t("statuses.rejected"), value: proof.note }]
          : []),
      ],
      actions: (
        <div className="flex flex-col gap-3">
          {canReview && (proof.status === "received" || proof.status === "matched") ? (
            <ProofDecision id={proof.id} reference={proof.reference} />
          ) : null}
          {proof.order ? (
            <Button asChild variant="secondary" size="md">
              <Link href={`/secure-admin-control/orders/${proof.order.id}`} prefetch={false}>
                {t("openOrder")}
              </Link>
            </Button>
          ) : null}
        </div>
      ),
    };
  });

  const columns: ColumnSpec[] = [
    { key: "name", label: t("colPayer"), always: true },
    { key: "status", label: t("colStatus"), always: true },
    { key: "amount", label: t("amount"), sort: "amount", align: "end" },
    { key: "account", label: t("account") },
    { key: "order", label: t("colOrder") },
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
          href: value === "received" ? PATH : `${PATH}?status=${value}`,
        }))}
      />
      <AdminDataTable
        listKey="proofs"
        path={PATH}
        rows={rows}
        columns={columns}
        page={{ total: list.total, page: list.page, pageSize: list.pageSize }}
        searchLabel={t("search")}
        openLabel={tc("open")}
        empty={{ title: t("emptyTitle"), body: t("emptyBody") }}
        messagePaths={PROOF_MESSAGES}
      />
    </>
  );
}

/** Offline payment proofs for Accounts (AdminPayments board, proofs queue) on the DataTable (D0 R5). */
export default function PaymentsPage(props: PageProps<"/[locale]/secure-admin-control/payments">) {
  return (
    <Suspense fallback={<Skeleton className="h-140 rounded-2xl" />}>
      <Proofs searchParams={props.searchParams} />
    </Suspense>
  );
}
