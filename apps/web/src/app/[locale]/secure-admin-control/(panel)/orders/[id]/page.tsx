import { Suspense } from "react";
import type { Metadata } from "next";
import { Phone } from "@/components/icons/server/Phone";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { AdminNotFound } from "@/components/admin/AdminNotFound";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { InboxListPane, type InboxPaneItem } from "@/components/admin/inbox/InboxListPane";
import { InboxSplit } from "@/components/admin/inbox/InboxSplit";
import { OrderStatusChip } from "@/components/admin/OrderStatusChip";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { CustomerFiles } from "@/components/admin/files/CustomerFiles";
import { expectedFiles } from "@/lib/admin/expectedFiles";
import { OrderSteps } from "@/components/admin/OrderSteps";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { pickMessagePaths } from "@/i18n/pickMessages";
import { adminFind, adminGet, hasRole, requireStaff } from "@/lib/admin/adminApi";
import { displayPhone, formatDhakaDateTime, taka, whatsappHref } from "@/lib/admin/format";
import { orderListQuery, queueSearch, withSearch } from "@/lib/admin/queues";
import { getPaymentSettings } from "@/lib/data/settings";
import type { OrderDetail, OrderRow, Paged } from "@/lib/admin/types";
import { OrderNote } from "./_components/OrderNote";

/** Only the order steps' words reach the browser (scoped provider, D190). */
const ORDER_MESSAGES = ["Admin.orderSteps"];
const ORDERS = "/secure-admin-control/orders";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.orders");
  return { title: t("metaTitle") };
}

type Params = PageProps<"/[locale]/secure-admin-control/orders/[id]">;

async function Order({ params, searchParams }: Pick<Params, "params" | "searchParams">) {
  const [{ id }, search] = await Promise.all([params, searchParams]);
  // The orders list the person came from, beside the order on wide screens (D0 R6).
  const query = orderListQuery(search);
  const back = withSearch(ORDERS, queueSearch(query));
  const [staff, order, queue, payment, t, tc, ts, tl, tp, messages] = await Promise.all([
    requireStaff(),
    adminFind<OrderDetail>(`/admin/orders/${encodeURIComponent(id)}`),
    adminGet<Paged<OrderRow>>("/admin/orders", query).catch(() => null),
    getPaymentSettings(),
    getTranslations("Admin.orders"),
    getTranslations("Admin.common"),
    getTranslations("Admin.orderSteps"),
    getTranslations("Admin.lead"),
    getTranslations("Admin.proofs"),
    getMessages(),
  ]);
  if (!order) return <AdminNotFound />;
  const canMove = hasRole(staff, "admin", "shop-manager");
  const status = (value: string) =>
    ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"].includes(
      value,
    )
      ? t(`statuses.${value}` as "statuses.placed")
      : value;

  // The account the customer paid into, by its name in Settings (never its internal key).
  const accountId = order.payment.method === "offline" ? order.payment.accountId : null;
  const paidTo = accountId
    ? (payment.offlineAccounts.find((account) => account.id === accountId)?.title ?? "")
    : "";

  const detail = (
    <>
      <AdminPageHeader
        back={{ href: back, label: t("title") }}
        title={order.reference}
        status={<OrderStatusChip status={order.status} label={status(order.status)} size="md" />}
        lead={`${order.address.name} · ${formatDhakaDateTime(order.createdAt)} · ${taka(order.total)}`}
      />
      {/* Room for the phone's bottom bar; two columns when the detail itself is wide. */}
      <div className="@container pb-24 md:pb-0">
        <div className="grid grid-cols-1 gap-4 @4xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-4">
            <AdminPanel title={t("items")} flush>
              <ul className="divide-y divide-mist-100">
                {order.items.map((item) => (
                  <li
                    key={item.variantId}
                    className="flex items-start justify-between gap-4 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-ink-900">{item.title}</p>
                      <p className="text-[13px] text-mist-600">
                        {item.variantLabel ? `${item.variantLabel} · ` : ""}
                        {item.sku} · {item.quantity} × {taka(item.unitPrice)}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums">{taka(item.lineTotal)}</p>
                  </li>
                ))}
              </ul>
              <dl className="flex flex-col gap-1.5 border-t border-mist-100 px-5 py-4 text-[14.5px]">
                <div className="flex justify-between">
                  <dt className="text-mist-600">{t("subtotal")}</dt>
                  <dd className="tabular-nums">{taka(order.subtotal)}</dd>
                </div>
                {order.discount > 0 ? (
                  <div className="flex justify-between">
                    <dt className="text-mist-600">
                      {order.couponCode ? t("coupon", { code: order.couponCode }) : t("discount")}
                    </dt>
                    <dd className="tabular-nums">-{taka(order.discount)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <dt className="text-mist-600">{order.pickup ? t("pickup") : t("delivery")}</dt>
                  <dd className="tabular-nums">{taka(order.delivery)}</dd>
                </div>
                <div className="flex justify-between border-t border-mist-100 pt-2 font-semibold">
                  <dt>{t("total")}</dt>
                  <dd className="tabular-nums">{taka(order.total)}</dd>
                </div>
              </dl>
            </AdminPanel>

            <AdminPanel title={t("history")}>
              <ol className="flex flex-col gap-3 border-l-2 border-mist-200 pl-4">
                {order.history.map((event, index) => (
                  <li key={`${event.at}-${index}`} className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute top-1.5 -left-[23px] size-3 rounded-full bg-electric-600 ring-4 ring-white"
                    />
                    <p className="text-[14.5px] font-semibold text-ink-900">
                      {status(event.status)}
                    </p>
                    <p className="text-[13px] text-mist-600">
                      {formatDhakaDateTime(event.at)}
                      {event.actor ? ` · ${event.actor}` : ""}
                    </p>
                    {event.note ? <p className="mt-0.5 text-[14px]">{event.note}</p> : null}
                    {event.courier ? (
                      <p className="mt-0.5 text-[14px]">
                        {event.courier}
                        {event.trackingNumber ? ` · ${event.trackingNumber}` : ""}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </AdminPanel>
          </div>

          {/* The next step first on a narrow screen; beside the items when there is room. */}
          <div className="order-first flex flex-col gap-4 @4xl:order-none">
            <AdminPanel>
              {canMove ? (
                <NextIntlClientProvider messages={pickMessagePaths(messages, ORDER_MESSAGES)}>
                  <OrderSteps
                    id={order.id}
                    status={order.status}
                    cashOnDelivery={order.cashOnDelivery}
                    paymentVerified={order.paymentVerified}
                    phone={order.address.phone}
                    whatsappHref={whatsappHref(order.address.phone, order.reference)}
                  />
                </NextIntlClientProvider>
              ) : null}
              <div className={canMove ? "mt-5 border-t border-mist-100 pt-4" : undefined}>
                <OrderNote
                  id={order.id}
                  strings={{
                    label: ts("addNote"),
                    placeholder: ts("notePlaceholder"),
                    submit: ts("addNote"),
                    added: ts("noteAdded"),
                    failed: tc("unavailable"),
                  }}
                />
              </div>
            </AdminPanel>
            <AdminPanel title={t("address")}>
              <address className="flex flex-col gap-0.5 text-[14.5px] not-italic">
                <span className="font-semibold">{order.address.name}</span>
                <span className="tabular-nums">{displayPhone(order.address.phone)}</span>
                {order.address.email ? (
                  <span className="break-all">{order.address.email}</span>
                ) : null}
                {!order.pickup ? (
                  <span className="mt-1 text-mist-700">
                    {order.address.street}, {order.address.area}, {order.address.district},{" "}
                    {order.address.division}
                  </span>
                ) : null}
                {order.address.note ? (
                  <span className="mt-1 text-mist-600">{order.address.note}</span>
                ) : null}
              </address>
              <div className="mt-4 flex gap-2">
                <Button asChild variant="secondary" size="sm">
                  <a href={`tel:${order.address.phone}`}>
                    <Phone aria-hidden="true" className="size-4" />
                    {t("call")}
                  </a>
                </Button>
                <Button asChild variant="whatsapp" size="sm">
                  <a
                    href={whatsappHref(order.address.phone, order.reference)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <WhatsAppIcon className="size-4" />
                    {t("whatsapp")}
                  </a>
                </Button>
              </div>
            </AdminPanel>
            <AdminPanel title={t("payment")}>
              <p className="text-[14.5px]">
                {order.payment.method === "cod" ? t("cod") : t("offline")}
                {paidTo ? ` · ${paidTo}` : ""}
              </p>
              {order.payment.method === "offline" ? (
                <p className="text-[13.5px] text-mist-600">
                  {t("transaction", { id: order.payment.transactionId })}
                </p>
              ) : null}
              <Badge className="mt-2" variant={order.paymentVerified ? "success" : "neutral"}>
                {order.paymentVerified ? t("verified") : t("notVerified")}
              </Badge>
              {order.invoice ? (
                <p className="mt-3 text-[14px]">
                  {t("invoice")}: {order.invoice.companyName} ·{" "}
                  {t("bin", { bin: order.invoice.bin })}
                </p>
              ) : null}
              {order.proofs.length > 0 ? (
                <div className="mt-3 border-t border-mist-100 pt-3">
                  <p className="text-[12.5px] font-semibold text-mist-600">{t("proofs")}</p>
                  <ul className="mt-1 flex flex-col gap-1 text-[14px]">
                    {order.proofs.map((proof) => (
                      <li key={proof.id}>
                        {taka(proof.amount)} · {proof.transactionId ?? t("slip")} ·{" "}
                        {tp(`statuses.${proof.status}` as "statuses.received")}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </AdminPanel>
            <CustomerFiles owner="order" id={order.id} expected={expectedFiles(order.payment)} />
          </div>
        </div>
      </div>
    </>
  );

  if (!queue) return detail;
  const items: InboxPaneItem[] = queue.items.map((item) => ({
    id: item.id,
    href: withSearch(`${ORDERS}/${item.id}`, queueSearch(query)),
    title: item.name,
    subtitle: item.reference,
    chips: [{ family: "order", name: item.status, label: status(item.status) }],
    meta: taka(item.total),
  }));
  return (
    <InboxSplit
      id="orders"
      resizeLabel={tl("resize")}
      list={
        <InboxListPane
          title={t("title")}
          allHref={back}
          allLabel={tl("paneAll")}
          count={tl("queueCount", { shown: items.length, total: queue.total })}
          items={items}
          activeId={order.id}
          empty={tl("queueEmpty")}
        />
      }
    >
      {detail}
    </InboxSplit>
  );
}

/** One order in the inbox (ADMIN.md §5.5, D0 R6): next steps, items, the customer, history, its queue beside it. */
export default function OrderPage(props: Params) {
  return (
    <Suspense fallback={<Skeleton className="h-160 rounded-2xl" />}>
      <Order params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
