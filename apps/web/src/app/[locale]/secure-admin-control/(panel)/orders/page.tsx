import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { OrderStatusSchema } from "@waafa/shared";
import { AdminEmpty } from "@/components/admin/AdminEmpty";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { OrderStatusChip } from "@/components/admin/OrderStatusChip";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ListFilters } from "@/components/admin/ListFilters";
import { StatusTabs } from "@/components/admin/StatusTabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { adminGet } from "@/lib/admin/adminApi";
import { displayPhone, formatDhakaDateTime, taka, pageParam } from "@/lib/admin/format";
import type { OrderRow, Paged } from "@/lib/admin/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.orders");
  return { title: t("metaTitle") };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

async function Orders({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/orders">["searchParams"];
}) {
  const params = await searchParams;
  const status = OrderStatusSchema.safeParse(one(params.status)).data;
  const q = one(params.q)?.slice(0, 80);
  const page = pageParam(params.page);
  const [list, t, tc] = await Promise.all([
    adminGet<Paged<OrderRow>>("/admin/orders", { status, q, page, pageSize: 25 }),
    getTranslations("Admin.orders"),
    getTranslations("Admin.common"),
  ]);
  const current = { status, q };

  return (
    <>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <StatusTabs
        label={t("title")}
        current={status ?? "all"}
        items={[
          { value: "all", label: t("statusAll"), href: "/secure-admin-control/orders" },
          ...OrderStatusSchema.options.map((value) => ({
            value,
            label: t(`statuses.${value}`),
            href: `/secure-admin-control/orders?status=${value}`,
          })),
        ]}
      />
      <section className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
        <div className="border-b border-mist-100 p-4">
          <ListFilters
            query={current}
            search={{
              name: "q",
              label: tc("search"),
              placeholder: t("searchPlaceholder"),
              value: q ?? "",
            }}
            strings={{ apply: tc("apply"), reset: tc("reset") }}
          />
        </div>
        {list.items.length === 0 ? (
          <AdminEmpty title={t("emptyTitle")} body={t("emptyBody")} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("colOrder")}</TableHead>
                <TableHead>{t("colCustomer")}</TableHead>
                <TableHead className="text-right">{t("colItems")}</TableHead>
                <TableHead className="text-right">{t("colTotal")}</TableHead>
                <TableHead>{t("colPayment")}</TableHead>
                <TableHead>{t("colStatus")}</TableHead>
                <TableHead>{t("colPlaced")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`/secure-admin-control/orders/${order.id}`}
                      prefetch={false}
                      className="font-mono text-[13px] font-semibold text-brand-700 hover:underline"
                    >
                      {order.reference}
                    </Link>
                    {order.pickup ? (
                      <p className="text-[12.5px] text-mist-600">{t("pickup")}</p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold">{order.name}</p>
                    <p className="text-[13px] text-mist-600 tabular-nums">
                      {displayPhone(order.phone)}
                    </p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{order.items}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {taka(order.total)}
                  </TableCell>
                  <TableCell>
                    <p>{order.payment === "cod" ? t("cod") : t("offline")}</p>
                    <Badge variant={order.paymentVerified ? "success" : "neutral"}>
                      {order.paymentVerified ? t("verified") : t("notVerified")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <OrderStatusChip status={order.status} label={t(`statuses.${order.status}`)} />
                  </TableCell>
                  <TableCell className="text-[13px] whitespace-nowrap text-mist-600">
                    {formatDhakaDateTime(order.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <AdminPagination
          page={list.page}
          pageSize={list.pageSize}
          total={list.total}
          path="/secure-admin-control/orders"
          query={current}
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

/** Orders (AdminOrders, AdminOrders-m boards). */
export default function OrdersPage(props: PageProps<"/[locale]/secure-admin-control/orders">) {
  return (
    <Suspense fallback={<Skeleton className="h-[640px] rounded-2xl" />}>
      <Orders searchParams={props.searchParams} />
    </Suspense>
  );
}
