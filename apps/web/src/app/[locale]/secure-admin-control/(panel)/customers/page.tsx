import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CustomerTabs } from "@/components/admin/CustomerTabs";
import { AdminDataTable } from "@/components/admin/table/AdminDataTable";
import { pageSizeOf, sortOf } from "@/components/admin/table/listQuery";
import type { ColumnSpec, DataRow } from "@/components/admin/table/types";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGet } from "@/lib/admin/adminApi";
import { displayPhone, formatDhakaDateTime, initialsOf, pageParam, taka } from "@/lib/admin/format";

type CustomerRow = {
  phone: string;
  name: string;
  email: string | null;
  leads: number;
  orders: number;
  spent: number;
  lastActivityAt: string;
};
type CustomerList = { items: CustomerRow[]; total: number; page: number; pageSize: number };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.customers");
  return { title: t("metaTitle") };
}

const SORTS = [
  "last.asc",
  "last.desc",
  "spent.asc",
  "spent.desc",
  "orders.asc",
  "orders.desc",
] as const;
const PATH = "/secure-admin-control/customers";

async function Customers({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/customers">["searchParams"];
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const sort = sortOf(params.sort, SORTS);
  const [list, t, tc] = await Promise.all([
    adminGet<CustomerList>("/admin/customers", {
      page: pageParam(params.page),
      pageSize: pageSizeOf(params.pageSize),
      ...(q ? { q } : {}),
      ...(sort ? { sort } : {}),
    }),
    getTranslations("Admin.customers"),
    getTranslations("Admin.common"),
  ]);

  const rows: DataRow[] = list.items.map((row) => {
    const name = row.name || displayPhone(row.phone);
    const last = formatDhakaDateTime(row.lastActivityAt);
    return {
      id: row.phone,
      href: `${PATH}/${encodeURIComponent(row.phone)}`,
      title: name,
      subtitle: [displayPhone(row.phone), row.email ?? ""].filter(Boolean).join(" · "),
      thumb: { initials: initialsOf(name) },
      chips: [],
      facts: {
        leads: { text: String(row.leads), kind: "money" },
        orders: { text: String(row.orders), kind: "money" },
        spent: { text: taka(row.spent), kind: "money" },
        last: { text: last, kind: "date" },
      },
      summary: [
        { label: t("colPhone"), value: displayPhone(row.phone) },
        ...(row.email ? [{ label: t("colEmail"), value: row.email }] : []),
        { label: t("colLeads"), value: String(row.leads) },
        { label: t("colOrders"), value: String(row.orders) },
        { label: t("colSpent"), value: taka(row.spent) },
        { label: t("colLast"), value: last },
      ],
    };
  });

  const columns: ColumnSpec[] = [
    { key: "name", label: t("colCustomer"), always: true },
    { key: "leads", label: t("colLeads"), align: "end" },
    { key: "orders", label: t("colOrders"), sort: "orders", align: "end" },
    { key: "spent", label: t("colSpent"), sort: "spent", align: "end" },
    { key: "last", label: t("colLast"), sort: "last" },
  ];

  return (
    <>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <CustomerTabs current="customers" />
      <AdminDataTable
        listKey="customers"
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

/** Admin › Customers (issue 111): one row per phone number across leads and orders, on the DataTable (D0 R5). */
export default function CustomersPage(
  props: PageProps<"/[locale]/secure-admin-control/customers">,
) {
  return (
    <Suspense fallback={<Skeleton className="h-120 rounded-2xl" />}>
      <Customers searchParams={props.searchParams} />
    </Suspense>
  );
}
