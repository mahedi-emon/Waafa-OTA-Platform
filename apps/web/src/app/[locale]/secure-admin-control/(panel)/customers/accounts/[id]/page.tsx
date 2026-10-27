import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { formatTaka } from "@waafa/shared";
import { ActionButton } from "@/components/admin/ActionButton";
import { AdminNotFound } from "@/components/admin/AdminNotFound";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { LeadStatusBadge } from "@/components/admin/LeadStatusBadge";
import { OrderStatusChip } from "@/components/admin/OrderStatusChip";
import { StatusChip } from "@/components/admin/StatusChip";
import { AttachRecordForm } from "@/components/admin/customers/AttachRecordForm";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import { adminFind, hasRole, requireStaff } from "@/lib/admin/adminApi";
import {
  disableAccount,
  enableAccount,
  signOutEverywhere,
} from "@/lib/admin/customerAccountActions";
import { displayPhone, formatDhakaDateTime } from "@/lib/admin/format";
import { USER_CHIPS } from "@/lib/admin/statusChips";
import type { CustomerAccountRow } from "../page";

type AccountDetail = {
  account: CustomerAccountRow;
  openSessions: number;
  leads: Array<{
    id: string;
    reference: string;
    module: string;
    status: string;
    summary: string;
    createdAt: string;
  }>;
  orders: Array<{
    id: string;
    reference: string;
    status: string;
    total: number;
    createdAt: string;
  }> | null;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.customerAccounts");
  return { title: t("detailTitle") };
}

async function Account({
  params,
}: {
  params: PageProps<"/[locale]/secure-admin-control/customers/accounts/[id]">["params"];
}) {
  const { id } = await params;
  const [detail, staff, t, tm, ts, to] = await Promise.all([
    adminFind<AccountDetail>(`/admin/customers/accounts/${encodeURIComponent(id)}`),
    requireStaff(),
    getTranslations("Admin.customerAccounts"),
    getTranslations("Admin.modules"),
    getTranslations("Admin.statuses"),
    getTranslations("Admin.orders.statuses"),
  ]);
  if (!detail) return <AdminNotFound />;
  const { account } = detail;
  const label = (bag: typeof tm, key: string) => (bag.has(key as never) ? bag(key as never) : key);
  const admin = hasRole(staff, "admin");
  const chip = account.disabled ? "disabled" : account.verified ? "active" : "invited";
  const method = t(
    `methods.${
      account.signInMethod === "google" ||
      account.signInMethod === "email-code" ||
      account.signInMethod === "password"
        ? account.signInMethod
        : "none"
    }`,
  );
  const facts = [
    { label: t("colMethod"), value: method },
    {
      label: t("colLast"),
      value: account.lastSignInAt ? formatDhakaDateTime(account.lastSignInAt) : t("never"),
    },
    { label: t("phone"), value: account.phone ? displayPhone(account.phone) : t("noPhone") },
    { label: t("created"), value: formatDhakaDateTime(account.createdAt) },
    { label: t("openSessions"), value: t("sessions", { count: detail.openSessions }) },
  ];

  return (
    <>
      <AdminPageHeader
        title={account.name}
        lead={account.email}
        back={{ href: "/secure-admin-control/customers/accounts", label: t("back") }}
      />
      <section
        aria-labelledby="account-facts"
        className="flex flex-col gap-4 rounded-2xl border border-mist-200 bg-white p-5"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="account-facts" className="sr-only">
            {t("detailTitle")}
          </h2>
          <StatusChip
            {...USER_CHIPS[chip]}
            label={
              account.disabled ? t("disabled") : account.verified ? t("verified") : t("unverified")
            }
          />
        </div>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label} className="flex flex-col gap-0.5">
              <dt className="text-[13px] text-mist-600">{fact.label}</dt>
              <dd className="font-semibold text-navy-900 tabular-nums">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        aria-labelledby="account-actions"
        className="flex flex-col gap-4 rounded-2xl border border-mist-200 bg-white p-5"
      >
        <h2 id="account-actions" className="font-display text-lg font-bold text-navy-900">
          {t("actionsTitle")}
        </h2>
        {admin ? (
          <div className="flex flex-wrap gap-2">
            {account.disabled ? (
              <ActionButton
                action={enableAccount.bind(null, account.id)}
                success={t("enabledDone")}
                failed={t("failed")}
              >
                {t("enable")}
              </ActionButton>
            ) : (
              <>
                <ActionButton
                  action={signOutEverywhere.bind(null, account.id)}
                  confirm={t("signOutConfirm")}
                  success={t("signedOutDone")}
                  failed={t("failed")}
                >
                  {t("signOut")}
                </ActionButton>
                <ActionButton
                  action={disableAccount.bind(null, account.id, undefined)}
                  confirm={t("disableConfirm")}
                  success={t("disabledDone")}
                  failed={t("failed")}
                  variant="danger"
                >
                  {t("disable")}
                </ActionButton>
              </>
            )}
          </div>
        ) : (
          <p className="text-[14px] text-mist-600">{t("adminOnly")}</p>
        )}
        <div className="flex flex-col gap-2 border-t border-mist-100 pt-4">
          <h3 className="font-semibold text-navy-900">{t("attachTitle")}</h3>
          <p className="text-[14px] text-mist-600">{t("attachLead")}</p>
          <AttachRecordForm
            accountId={account.id}
            kinds={[
              { value: "lead", label: t("attachKinds.lead") },
              ...(detail.orders === null
                ? []
                : [{ value: "order" as const, label: t("attachKinds.order") }]),
            ]}
            labels={{
              kind: t("attachKind"),
              reference: t("attachReference"),
              hint: t("attachReferenceHint"),
              submit: t("attach"),
              done: t("attached"),
              failed: t("failed"),
            }}
          />
        </div>
      </section>

      <section
        aria-labelledby="account-requests"
        className="flex flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5"
      >
        <h2 id="account-requests" className="font-display text-lg font-bold text-navy-900">
          {t("requestsTitle")}
        </h2>
        {detail.leads.length === 0 ? (
          <p className="text-sm text-mist-600">{t("noRequests")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-mist-100">
            {detail.leads.map((lead) => (
              <li key={lead.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="min-w-0">
                  <Link
                    href={`/secure-admin-control/leads/${lead.id}`}
                    className="font-semibold text-navy-900 hover:underline"
                  >
                    {lead.reference}
                  </Link>
                  <span className="block text-sm text-mist-700">{lead.summary}</span>
                </span>
                <span className="flex flex-wrap items-center gap-2 text-[13px] text-mist-600">
                  <Badge variant="neutral">{label(tm, lead.module)}</Badge>
                  <LeadStatusBadge status={lead.status} label={label(ts, lead.status)} />
                  {formatDhakaDateTime(lead.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {detail.orders ? (
        <section
          aria-labelledby="account-orders"
          className="flex flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5"
        >
          <h2 id="account-orders" className="font-display text-lg font-bold text-navy-900">
            {t("ordersTitle")}
          </h2>
          {detail.orders.length === 0 ? (
            <p className="text-sm text-mist-600">{t("noOrders")}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-mist-100">
              {detail.orders.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <Link
                    href={`/secure-admin-control/orders/${order.id}`}
                    className="font-semibold text-navy-900 hover:underline"
                  >
                    {order.reference}
                  </Link>
                  <span className="flex flex-wrap items-center gap-2 text-[13px] text-mist-600">
                    <OrderStatusChip status={order.status} label={label(to, order.status)} />
                    <span className="font-semibold text-navy-900 tabular-nums">
                      {formatTaka(order.total)}
                    </span>
                    {formatDhakaDateTime(order.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </>
  );
}

/** Admin › Customers › Accounts › one account (issue 241): facts, controls, and the records on it. */
export default function CustomerAccountPage(
  props: PageProps<"/[locale]/secure-admin-control/customers/accounts/[id]">,
) {
  return (
    <Suspense fallback={<Skeleton className="h-[480px] rounded-2xl" />}>
      <Account params={props.params} />
    </Suspense>
  );
}
