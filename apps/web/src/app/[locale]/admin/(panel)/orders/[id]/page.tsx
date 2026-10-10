import { Suspense } from "react";
import type { Metadata } from "next";
import { Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGet, hasRole, requireStaff } from "@/lib/admin/adminApi";
import { displayPhone, formatDhakaDateTime, taka, whatsappHref } from "@/lib/admin/format";
import type { OrderDetail } from "@/lib/admin/types";
import { OrderActions } from "./_components/OrderActions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.orders");
  return { title: t("metaTitle") };
}

async function Order({ params }: { params: PageProps<"/[locale]/admin/orders/[id]">["params"] }) {
  const { id } = await params;
  const [staff, order, t, tc] = await Promise.all([
    requireStaff(),
    adminGet<OrderDetail>(`/admin/orders/${encodeURIComponent(id)}`),
    getTranslations("Admin.orders"),
    getTranslations("Admin.common"),
  ]);
  const canMove = hasRole(staff, "admin", "shop-manager");
  const status = (value: string) =>
    ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"].includes(
      value,
    )
      ? t(`statuses.${value}` as "statuses.placed")
      : value;

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/orders", label: t("title") }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{order.reference}</span>
            <Badge variant={order.status === "delivered" ? "success" : "brand"}>
              {status(order.status)}
            </Badge>
          </span>
        }
        lead={`${formatDhakaDateTime(order.createdAt)} · ${taka(order.total)}`}
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
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
                  <p className="text-[14.5px] font-semibold text-ink-900">{status(event.status)}</p>
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

        <div className="flex flex-col gap-4">
          <AdminPanel>
            <OrderActions
              id={order.id}
              next={order.next.map((value) => ({ value, label: status(value) }))}
              paymentVerified={order.paymentVerified}
              canMove={canMove}
              strings={{
                moveTo: t("moveTo"),
                courier: t("courier"),
                tracking: t("tracking"),
                note: t("note"),
                update: t("update"),
                updated: t("updated"),
                failed: tc("unavailable"),
                markVerified: t("markVerified"),
                markNotVerified: t("markNotVerified"),
                final: t("final"),
              }}
            />
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
              {order.payment.method === "offline" ? ` · ${order.payment.accountId}` : ""}
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
                {t("invoice")}: {order.invoice.companyName} · {t("bin", { bin: order.invoice.bin })}
              </p>
            ) : null}
            {order.proofs.length > 0 ? (
              <div className="mt-3 border-t border-mist-100 pt-3">
                <p className="text-[12.5px] font-semibold text-mist-600">{t("proofs")}</p>
                <ul className="mt-1 flex flex-col gap-1 text-[14px]">
                  {order.proofs.map((proof) => (
                    <li key={proof.id}>
                      {taka(proof.amount)} · {proof.transactionId ?? t("slip")} · {proof.status}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </AdminPanel>
        </div>
      </div>
    </>
  );
}

/** Order detail (AdminOrders-open board). */
export default function OrderPage(props: PageProps<"/[locale]/admin/orders/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[640px] rounded-2xl" />}>
      <Order params={props.params} />
    </Suspense>
  );
}
