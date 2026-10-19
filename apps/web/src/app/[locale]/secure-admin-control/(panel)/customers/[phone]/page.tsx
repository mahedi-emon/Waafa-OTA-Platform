import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { formatTaka } from "@waafa/shared";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { LeadStatusBadge } from "@/components/admin/LeadStatusBadge";
import { OrderStatusChip } from "@/components/admin/OrderStatusChip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { adminGet } from "@/lib/admin/adminApi";
import { formatDhakaDateTime } from "@/lib/admin/format";

type Profile = {
  phone: string;
  name: string;
  email: string | null;
  spent: number;
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
  const t = await getTranslations("Admin.customers");
  return { title: t("profileTitle") };
}

async function CustomerProfile({
  params,
}: {
  params: PageProps<"/[locale]/secure-admin-control/customers/[phone]">["params"];
}) {
  const { phone } = await params;
  const [profile, t, tm, ts, to] = await Promise.all([
    adminGet<Profile>(`/admin/customers/${encodeURIComponent(decodeURIComponent(phone))}`),
    getTranslations("Admin.customers"),
    getTranslations("Admin.modules"),
    getTranslations("Admin.statuses"),
    getTranslations("Admin.orders.statuses"),
  ]);
  const label = (bag: typeof tm, key: string) => (bag.has(key as never) ? bag(key as never) : key);

  return (
    <>
      <AdminPageHeader
        title={profile.name || profile.phone}
        lead={[profile.phone, profile.email].filter(Boolean).join(" · ")}
        back={{ href: "/secure-admin-control/customers", label: t("back") }}
      />
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label={t("summary")}>
        <li className="rounded-2xl border border-mist-200 bg-white p-4">
          <p className="text-[13px] text-mist-600">{t("colLeads")}</p>
          <p className="font-display text-[22px] font-extrabold text-navy-900 tabular-nums">
            {profile.leads.length}
          </p>
        </li>
        {profile.orders ? (
          <>
            <li className="rounded-2xl border border-mist-200 bg-white p-4">
              <p className="text-[13px] text-mist-600">{t("colOrders")}</p>
              <p className="font-display text-[22px] font-extrabold text-navy-900 tabular-nums">
                {profile.orders.length}
              </p>
            </li>
            <li className="rounded-2xl border border-mist-200 bg-white p-4">
              <p className="text-[13px] text-mist-600">{t("colSpent")}</p>
              <p className="font-display text-[22px] font-extrabold text-navy-900 tabular-nums">
                {formatTaka(profile.spent)}
              </p>
            </li>
          </>
        ) : null}
      </ul>

      <section
        aria-labelledby="customer-leads"
        className="flex flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5"
      >
        <h2 id="customer-leads" className="font-display text-lg font-bold text-navy-900">
          {t("leadsTitle")}
        </h2>
        {profile.leads.length === 0 ? (
          <p className="text-sm text-mist-600">{t("noLeads")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-mist-100">
            {profile.leads.map((lead) => (
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

      {profile.orders ? (
        <section
          aria-labelledby="customer-orders"
          className="flex flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5"
        >
          <h2 id="customer-orders" className="font-display text-lg font-bold text-navy-900">
            {t("ordersTitle")}
          </h2>
          {profile.orders.length === 0 ? (
            <p className="text-sm text-mist-600">{t("noOrders")}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-mist-100">
              {profile.orders.map((order) => (
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

/** Admin › Customers › profile (issue 111): every lead and order of one phone number. */
export default function CustomerProfilePage(
  props: PageProps<"/[locale]/secure-admin-control/customers/[phone]">,
) {
  return (
    <Suspense fallback={<Skeleton className="h-[480px] rounded-2xl" />}>
      <CustomerProfile params={props.params} />
    </Suspense>
  );
}
