import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { OrderStatusSchema } from "@waafa/shared";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminDataTable } from "@/components/admin/table/AdminDataTable";
import type { ColumnSpec, DataRow } from "@/components/admin/table/types";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGet } from "@/lib/admin/adminApi";
import { displayPhone, formatDhakaDateTime, initialsOf, taka } from "@/lib/admin/format";
import { orderListQuery, queueSearch, withSearch } from "@/lib/admin/queues";
import type { OrderRow, Paged } from "@/lib/admin/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.orders");
  return { title: t("metaTitle") };
}

const PATH = "/secure-admin-control/orders";

async function Orders({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/orders">["searchParams"];
}) {
  const query = orderListQuery(await searchParams);
  // Each order opens with this list beside it and Back to it (D0 R6).
  const search = queueSearch(query);
  const [list, t, tc] = await Promise.all([
    adminGet<Paged<OrderRow>>("/admin/orders", query),
    getTranslations("Admin.orders"),
    getTranslations("Admin.common"),
  ]);

  const rows: DataRow[] = list.items.map((order) => {
    const payment =
      order.payment === "cod"
        ? t("cod")
        : order.payment === "online"
          ? t("onlineShort")
          : t("offline");
    const placed = formatDhakaDateTime(order.createdAt);
    return {
      id: order.id,
      href: withSearch(`${PATH}/${order.id}`, search),
      title: order.name,
      subtitle: [order.reference, order.pickup ? t("pickup") : ""].filter(Boolean).join(" · "),
      thumb: { initials: initialsOf(order.name) },
      chips: [
        { family: "order", name: order.status, label: t(`statuses.${order.status}`) },
        ...(order.paymentVerified
          ? [{ family: "proof" as const, name: "verified", label: t("verified") }]
          : []),
      ],
      facts: {
        items: { text: String(order.items), kind: "money" },
        total: { text: taka(order.total), kind: "money" },
        payment: {
          text: `${payment} · ${order.paymentVerified ? t("verified") : t("notVerified")}`,
          kind: "muted",
        },
        placed: { text: placed, kind: "date" },
      },
      summary: [
        { label: t("colOrder"), value: order.reference },
        { label: t("colPhone"), value: displayPhone(order.phone) },
        { label: t("colItems"), value: String(order.items) },
        { label: t("colTotal"), value: taka(order.total) },
        {
          label: t("colPayment"),
          value: `${payment} · ${order.paymentVerified ? t("verified") : t("notVerified")}`,
        },
        { label: t("colPlaced"), value: placed },
      ],
    };
  });

  const columns: ColumnSpec[] = [
    { key: "name", label: t("colCustomer"), always: true },
    { key: "status", label: t("colStatus"), always: true },
    { key: "total", label: t("colTotal"), sort: "total", align: "end" },
    { key: "items", label: t("colItems"), align: "end" },
    { key: "payment", label: t("colPayment") },
    { key: "placed", label: t("colPlaced"), sort: "created" },
  ];

  return (
    <>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <AdminDataTable
        listKey="orders"
        path={PATH}
        rows={rows}
        columns={columns}
        page={{ total: list.total, page: list.page, pageSize: list.pageSize }}
        searchLabel={t("searchPlaceholder")}
        filters={[
          {
            param: "status",
            label: t("colStatus"),
            options: OrderStatusSchema.options.map((value) => ({
              value,
              label: t(`statuses.${value}`),
            })),
          },
        ]}
        openLabel={tc("open")}
        empty={{ title: t("emptyTitle"), body: t("emptyBody") }}
      />
    </>
  );
}

/** Orders (AdminOrders, AdminOrders-m boards) on the shared DataTable (D0 R5). */
export default function OrdersPage(props: PageProps<"/[locale]/secure-admin-control/orders">) {
  return (
    <Suspense fallback={<Skeleton className="h-160 rounded-2xl" />}>
      <Orders searchParams={props.searchParams} />
    </Suspense>
  );
}
