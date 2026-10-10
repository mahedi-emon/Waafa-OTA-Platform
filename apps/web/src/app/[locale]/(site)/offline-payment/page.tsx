import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Building2, Landmark, Smartphone } from "lucide-react";
import { whatsappLink } from "@waafa/shared";
import { InfoCard } from "@/components/content/InfoCard";
import { PageHero } from "@/components/content/PageHero";
import { SampleBadge } from "@/components/content/SampleBadge";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Canonical } from "@/components/seo/Canonical";
import { Button } from "@/components/ui/button";
import { pickMessages } from "@/i18n/pickMessages";
import { listPageBlocks } from "@/lib/data/content";
import { getContactSettings, getLeadFormSettings, getPaymentSettings } from "@/lib/data/settings";
import { dialCode, isPhoneCountry } from "@/lib/leads/phone";
import { PaymentProofForm } from "./_components/PaymentProofForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("OfflinePay");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

const KIND_ICONS = {
  bank: Landmark,
  bkash: Smartphone,
  nagad: Smartphone,
  office: Building2,
} as const;

/**
 * /offline-payment (OfflinePay, OfflinePay-sent, -m): the admin's payment accounts, three steps (page blocks) and the
 * proof form. Online payment is not shown until it is live.
 */
export default async function OfflinePaymentPage() {
  const [payment, blocks, contact, leadForm, messages, t] = await Promise.all([
    getPaymentSettings(),
    listPageBlocks("offline-payment"),
    getContactSettings(),
    getLeadFormSettings(),
    getMessages(),
    getTranslations("OfflinePay"),
  ]);
  const steps = blocks.filter((block) => block.group === "steps");
  const transferAccounts = payment.offlineAccounts.filter((account) => account.kind !== "office");
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  const countries = leadForm.phoneCountries
    .filter(isPhoneCountry)
    .map((code) => ({ code, name: regionNames.of(code) ?? code, dial: dialCode(code) }));

  return (
    <main id="main" className="site-container flex flex-col gap-10 pt-4 pb-28 md:gap-14 md:pt-6">
      <Canonical path="/offline-payment" />
      <div className="flex flex-col gap-6">
        <Breadcrumbs items={[{ label: t("kicker") }]} />
        <PageHero
          kicker={t("kicker")}
          title={t("title")}
          lead={t("lead")}
          aside={
            payment.offlineAccounts.some((account) => account.sample) ? (
              <SampleBadge label={t("sample")} />
            ) : null
          }
        />
      </div>

      {payment.offlineAccounts.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {payment.offlineAccounts.map((account) => {
            const Icon = KIND_ICONS[account.kind];
            return (
              <li
                key={account.id}
                className="flex flex-col gap-3 rounded-[20px] border border-mist-200 bg-white p-5 md:p-6"
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="grid size-11 shrink-0 place-items-center rounded-xl bg-electric-50 text-brand-700"
                  >
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h2 className="font-display text-[18px] font-bold text-navy-900">
                      {account.title}
                    </h2>
                    <p className="text-[13.5px] text-mist-700">{t(`kinds.${account.kind}`)}</p>
                  </div>
                </div>
                <ul className="flex flex-col gap-1 rounded-xl bg-mist-50 p-4 text-[14.5px] text-ink-900">
                  {account.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                  {account.kind !== "office" ? (
                    <li className="font-semibold text-navy-900">{t("referenceNote")}</li>
                  ) : null}
                </ul>
                {account.instructions ? (
                  <p className="text-[13.5px] text-mist-700">{account.instructions}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {steps.length > 0 ? (
        <section aria-labelledby="offline-steps" className="flex flex-col gap-5">
          <h2 id="offline-steps" className="type-h2 text-navy-900">
            {t("stepsTitle")}
          </h2>
          <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {steps.map((block) => (
              <li key={block.id}>
                <InfoCard block={block} />
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {transferAccounts.length > 0 ? (
        <section
          id="proof"
          aria-labelledby="offline-proof"
          className="grid scroll-mt-28 grid-cols-1 gap-6 rounded-[24px] border border-mist-200 bg-white p-5 md:p-8 lg:grid-cols-[1fr_1.4fr] lg:gap-10"
        >
          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-bold tracking-[0.14em] text-brand-700 uppercase">
              {t("proof.kicker")}
            </p>
            <h2 id="offline-proof" className="type-h2 text-navy-900">
              {t("proof.title")}
            </h2>
            <p className="text-[15px] text-mist-700">{t("proof.lead")}</p>
            <Button asChild variant="whatsapp" className="mt-2 self-start">
              <a
                href={whatsappLink(contact.whatsappE164, t("proof.whatsappMessage"))}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon />
                {t("proof.whatsapp")}
              </a>
            </Button>
          </div>
          <NextIntlClientProvider messages={pickMessages(messages, ["OfflinePay"])}>
            <PaymentProofForm
              accounts={transferAccounts.map((account) => ({
                id: account.id,
                title: account.title,
              }))}
              countries={countries}
            />
          </NextIntlClientProvider>
        </section>
      ) : null}
    </main>
  );
}
