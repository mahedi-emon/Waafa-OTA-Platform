import { Suspense } from "react";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { formatDate, formatTaka, whatsappLink } from "@waafa/shared";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { EmptyState } from "@/components/feedback/EmptyState";
import { SmartImage } from "@/components/media/SmartImage";
import { Canonical } from "@/components/seo/Canonical";
import { ListingHeader } from "@/components/shop/ListingHeader";
import { OrderTimeline } from "@/components/shop/OrderTimeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { getContactSettings, getSiteSettings } from "@/lib/data/settings";
import { trackOrder } from "@/lib/data/orders";
import { clientKey } from "@/lib/rateLimit";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Track");
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

const first = (value: string | string[] | undefined) =>
  (typeof value === "string" ? value : "").trim().slice(0, 40);

async function TrackContent({
  searchParams,
}: Pick<PageProps<"/[locale]/shop/track">, "searchParams">) {
  const params = await searchParams;
  const reference = first(params.ref);
  const phone = first(params.phone);
  const [site, contact, t] = await Promise.all([
    getSiteSettings(),
    getContactSettings(),
    getTranslations("Track"),
  ]);
  const asked = reference !== "" || phone !== "";
  const order =
    reference && phone
      ? await trackOrder(reference, phone, { clientIp: clientKey(await headers()) })
      : null;

  return (
    <main id="main" className="site-container flex flex-col gap-6 pt-4 pb-28 md:pt-6">
      <Canonical path="/shop/track" />
      <ListingHeader
        crumbs={[{ label: site.storeName, href: "/shop" }, { label: t("title") }]}
        title={t("title")}
        lead={t("lead")}
      />

      <form
        method="get"
        action="/shop/track"
        className="grid max-w-3xl grid-cols-1 gap-3 rounded-2xl border border-mist-200 bg-white p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <label className="flex flex-col gap-1.5 text-[14px] font-semibold text-ink-900">
          {t("reference")}
          <Input
            name="ref"
            defaultValue={reference}
            placeholder={t("referencePlaceholder")}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[14px] font-semibold text-ink-900">
          {t("phone")}
          <Input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            defaultValue={phone}
            placeholder={t("phonePlaceholder")}
            required
          />
        </label>
        <Button type="submit">{t("submit")}</Button>
      </form>

      {order ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-8">
          <section
            aria-labelledby="track-progress"
            className="rounded-2xl border border-mist-200 bg-white p-5"
          >
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
              <h2
                id="track-progress"
                className="font-display text-[20px] font-extrabold text-navy-900"
              >
                {t(`status.${order.status}`)}
              </h2>
              <p className="text-[13.5px] text-mist-700">
                <span className="font-semibold text-ink-900 tabular-nums">{order.reference}</span> ·{" "}
                {t("placedOn", { date: formatDate(order.createdAt) })}
              </p>
            </div>
            <OrderTimeline
              history={order.history}
              status={order.status}
              heading={t("timeline")}
              courier={t("courier")}
              trackingNumber={t("trackingNumber")}
              labels={{
                placed: t("status.placed"),
                confirmed: t("status.confirmed"),
                processing: t("status.processing"),
                shipped: t("status.shipped"),
                delivered: t("status.delivered"),
                cancelled: t("status.cancelled"),
                returned: t("status.returned"),
              }}
            />
          </section>

          <aside className="flex flex-col gap-4 rounded-2xl border border-mist-200 bg-white p-5">
            <h2 className="font-display text-[18px] font-extrabold text-navy-900">{t("items")}</h2>
            <ul className="flex flex-col gap-3">
              {order.items.map((item) => (
                <li key={item.variantId} className="flex items-center gap-3">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-mist-50">
                    {item.image ? (
                      <SmartImage
                        src={item.image.src}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-contain p-1"
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1 text-[14px] leading-snug font-medium text-ink-900">
                    {item.title}
                    <span className="block text-[12.5px] font-normal text-mist-600">
                      {[item.variantLabel, `× ${item.quantity}`].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="text-[14px] font-semibold tabular-nums">
                    {formatTaka(item.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="flex items-baseline justify-between border-t border-mist-200 pt-3">
              <span className="font-display text-[16px] font-extrabold text-navy-900">
                {t("total")}
              </span>
              <span className="font-display text-[22px] font-extrabold text-navy-900 tabular-nums">
                {formatTaka(order.total)}
              </span>
            </p>
            <dl className="flex flex-col gap-3 text-[14px]">
              <div>
                <dt className="font-semibold text-ink-900">{t("deliveryTo")}</dt>
                <dd className="text-mist-700">
                  {order.pickup
                    ? t("pickupAt")
                    : `${order.address.name}, ${order.address.street}, ${order.address.area}, ${order.address.district}`}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ink-900">{t("payment")}</dt>
                <dd className="text-mist-700">
                  {order.payment.method === "cod" ? t("paymentCod") : t("paymentOffline")}
                  {" · "}
                  {order.paymentVerified || order.payment.method === "cod"
                    ? order.paymentVerified
                      ? t("paymentVerified")
                      : null
                    : t("paymentPending")}
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      ) : asked ? (
        <EmptyState
          icon={PackageSearch}
          title={t("notFound.title")}
          description={reference && phone ? t("notFound.body") : t("invalid")}
          action={
            <div className="flex flex-col items-center gap-2">
              <p className="text-[13.5px] text-mist-700">{t("notFound.help")}</p>
              <Button asChild variant="whatsapp">
                <a
                  href={whatsappLink(contact.whatsappE164, t("notFound.whatsappMessage"))}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon />
                  {t("notFound.whatsapp")}
                </a>
              </Button>
            </div>
          }
        />
      ) : null}

      {order ? (
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href="/shop/track">{t("another")}</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/shop">{t("continue")}</Link>
          </Button>
        </div>
      ) : null}
    </main>
  );
}

/** /shop/track (ShopTrack, -nf, -delivered, -m): the order number plus the phone on it, then the order's progress. */
export default function TrackPage({ searchParams }: PageProps<"/[locale]/shop/track">) {
  return (
    <Suspense fallback={<Skeleton className="m-4 h-96 rounded-2xl" />}>
      <TrackContent searchParams={searchParams} />
    </Suspense>
  );
}
