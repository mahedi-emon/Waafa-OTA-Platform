import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CustomerTabs } from "@/components/admin/CustomerTabs";
import { AdminDataTable } from "@/components/admin/table/AdminDataTable";
import type { ColumnSpec, DataRow } from "@/components/admin/table/types";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGet } from "@/lib/admin/adminApi";
import { displayPhone, formatDhakaDateTime, initialsOf, pageParam } from "@/lib/admin/format";

export type CustomerAccountRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  verified: boolean;
  signInMethod: string | null;
  lastSignInAt: string | null;
  disabled: boolean;
  createdAt: string;
  requests: number;
  orders: number | null;
};
type AccountList = { items: CustomerAccountRow[]; total: number; page: number; pageSize: number };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.customerAccounts");
  return { title: t("metaTitle") };
}

const PATH = "/secure-admin-control/customers/accounts";

async function Accounts({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/customers/accounts">["searchParams"];
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const [list, t, tc] = await Promise.all([
    adminGet<AccountList>("/admin/customers/accounts", {
      page: pageParam(params.page),
      ...(q ? { q } : {}),
    }),
    getTranslations("Admin.customerAccounts"),
    getTranslations("Admin.common"),
  ]);
  const method = (value: string | null) =>
    t(
      `methods.${value === "google" || value === "email-code" || value === "password" ? value : "none"}`,
    );

  const rows: DataRow[] = list.items.map((row) => {
    const last = row.lastSignInAt ? formatDhakaDateTime(row.lastSignInAt) : t("never");
    return {
      id: row.id,
      href: `${PATH}/${encodeURIComponent(row.id)}`,
      title: row.name,
      subtitle: [row.email, row.phone ? displayPhone(row.phone) : ""].filter(Boolean).join(" · "),
      thumb: { initials: initialsOf(row.name) },
      chips: [
        row.disabled
          ? { family: "user", name: "disabled", label: t("disabled") }
          : row.verified
            ? { family: "user", name: "active", label: t("verified") }
            : { family: "user", name: "invited", label: t("unverified") },
      ],
      facts: {
        method: { text: method(row.signInMethod) },
        last: { text: last, kind: "date" },
        requests: { text: String(row.requests), kind: "money" },
        ...(row.orders === null ? {} : { orders: { text: String(row.orders), kind: "money" } }),
      },
      summary: [
        { label: t("colMethod"), value: method(row.signInMethod) },
        { label: t("colLast"), value: last },
        { label: t("phone"), value: row.phone ? displayPhone(row.phone) : t("noPhone") },
        { label: t("colRequests"), value: String(row.requests) },
        ...(row.orders === null ? [] : [{ label: t("colOrders"), value: String(row.orders) }]),
      ],
    };
  });

  const columns: ColumnSpec[] = [
    { key: "name", label: t("colAccount"), always: true },
    { key: "method", label: t("colMethod") },
    { key: "last", label: t("colLast") },
    { key: "requests", label: t("colRequests"), align: "end" },
    ...(list.items.some((row) => row.orders !== null)
      ? [{ key: "orders", label: t("colOrders"), align: "end" as const }]
      : []),
  ];

  return (
    <>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <CustomerTabs current="accounts" />
      <AdminDataTable
        listKey="customer-accounts"
        path={PATH}
        rows={rows}
        columns={columns}
        page={{ total: list.total, page: list.page, pageSize: list.pageSize }}
        searchLabel={t("search")}
        openLabel={tc("open")}
        empty={{ title: t("emptyTitle"), body: t("emptyBody") }}
      />
    </>
  );
}

/** Admin › Customers › Accounts (issue 241): who signed in, how, when, and whether the account is on. */
export default function CustomerAccountsPage(
  props: PageProps<"/[locale]/secure-admin-control/customers/accounts">,
) {
  return (
    <Suspense fallback={<Skeleton className="h-120 rounded-2xl" />}>
      <Accounts searchParams={props.searchParams} />
    </Suspense>
  );
}
