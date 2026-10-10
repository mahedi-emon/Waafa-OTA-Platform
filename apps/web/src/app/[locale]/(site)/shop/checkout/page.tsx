import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Canonical } from "@/components/seo/Canonical";
import { ListingHeader } from "@/components/shop/ListingHeader";
import { isPhoneCountry, dialCode } from "@/lib/leads/phone";
import { pickMessages } from "@/i18n/pickMessages";
import {
  getContactSettings,
  getLeadFormSettings,
  getPaymentSettings,
  getShippingSettings,
  getSiteSettings,
} from "@/lib/data/settings";
import { CheckoutForm } from "./_components/CheckoutForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Checkout");
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

/** /shop/checkout (ShopCheckout, -err, -m): one page for contact, delivery, payment and the order summary. */
export default async function CheckoutPage() {
  const [site, shipping, payment, contact, leadForm, messages, t] = await Promise.all([
    getSiteSettings(),
    getShippingSettings(),
    getPaymentSettings(),
    getContactSettings(),
    getLeadFormSettings(),
    getMessages(),
    getTranslations("Checkout"),
  ]);
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  const countries = leadForm.phoneCountries
    .filter(isPhoneCountry)
    .map((code) => ({ code, name: regionNames.of(code) ?? code, dial: dialCode(code) }));

  return (
    <main id="main" className="site-container flex flex-col gap-6 pt-4 pb-32 md:pt-6">
      <Canonical path="/shop/checkout" />
      <ListingHeader
        crumbs={[
          { label: site.storeName, href: "/shop" },
          { label: t("crumbs.cart"), href: "/shop/cart" },
          { label: t("crumbs.checkout") },
        ]}
        title={t("title")}
        lead={t("lead")}
      />
      <NextIntlClientProvider messages={pickMessages(messages, ["Checkout"])}>
        <CheckoutForm
          countries={countries}
          shipping={shipping}
          codLimit={payment.codLimit}
          accounts={payment.offlineAccounts.map((account) => ({
            id: account.id,
            kind: account.kind,
            title: account.title,
            lines: account.lines,
            instructions: account.instructions,
          }))}
          phoneDisplay={contact.phoneDisplay}
          whatsappE164={contact.whatsappE164}
        />
      </NextIntlClientProvider>
    </main>
  );
}
