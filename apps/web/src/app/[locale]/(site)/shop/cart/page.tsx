import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Canonical } from "@/components/seo/Canonical";
import { ListingHeader } from "@/components/shop/ListingHeader";
import { pickMessages } from "@/i18n/pickMessages";
import { getPaymentSettings, getShippingSettings, getSiteSettings } from "@/lib/data/settings";
import { listCategories } from "@/lib/data/shop";
import { CartView } from "./_components/CartView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Cart");
  return { title: t("metaTitle"), robots: { index: false, follow: true } };
}

/** /shop/cart (ShopCart, -empty, -coupon, -m): the guest cart, priced by the server, with coupon and delivery area. */
export default async function CartPage() {
  const [site, shipping, payment, categories, messages, t, ts] = await Promise.all([
    getSiteSettings(),
    getShippingSettings(),
    getPaymentSettings(),
    listCategories(),
    getMessages(),
    getTranslations("Cart"),
    getTranslations("Cart.summary"),
  ]);
  const payWith = [ts("cod"), ...payment.offlineAccounts.map((account) => account.title)];

  return (
    <main id="main" className="site-container flex flex-col gap-6 pt-4 pb-32 md:pt-6">
      <Canonical path="/shop/cart" />
      <ListingHeader
        crumbs={[{ label: site.storeName, href: "/shop" }, { label: t("crumbs.cart") }]}
        title={t("title")}
      />
      <NextIntlClientProvider messages={pickMessages(messages, ["Cart"])}>
        <CartView
          storeName={site.storeName}
          zones={shipping.zones.map((zone) => ({
            id: zone.id,
            name: zone.name,
            estimate: zone.estimate,
          }))}
          freeDeliveryThreshold={shipping.freeDeliveryThreshold ?? null}
          payWith={payWith}
          categories={categories
            .filter((category) => category.level === 1)
            .map((category) => ({ slug: category.slug, name: category.name }))}
        />
      </NextIntlClientProvider>
    </main>
  );
}
