import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { HelpCard } from "@/components/results/HelpCard";
import { Skeleton } from "@/components/ui/skeleton";
import { pickMessages } from "@/i18n/pickMessages";
import { getContactSettings, getLeadFormSettings } from "@/lib/data/settings";
import { getVisaCountry, listVisaCountries } from "@/lib/data/visa";
import { dialCode, isPhoneCountry } from "@/lib/leads/phone";
import { VisaApplyRequest } from "./_components/VisaApplyRequest";

export async function generateStaticParams() {
  const countries = await listVisaCountries();
  return countries.map((country) => ({ country: country.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/visa-services/[country]/apply">): Promise<Metadata> {
  const { country: slug } = await params;
  const [country, t] = await Promise.all([getVisaCountry(slug), getTranslations("Visa.apply")]);
  if (!country) return {};
  return {
    title: t("metaTitle", { country: country.name }),
    description: t("lead"),
    alternates: { canonical: `/visa-services/${country.slug}/apply` },
    robots: { index: false },
  };
}

/** /visa-services/[country]/apply (VisaApply boards): contact first, then trip, documents, visit and review. */
async function VisaApplyPageContent({
  params,
}: Pick<PageProps<"/[locale]/visa-services/[country]/apply">, "params">) {
  const { country: slug } = await params;
  const country = await getVisaCountry(slug);
  if (!country) notFound();
  const [contact, leadForm, messages, t, tTypes] = await Promise.all([
    getContactSettings(),
    getLeadFormSettings(),
    getMessages(),
    getTranslations("Visa"),
    getTranslations("Search.visaTypes"),
  ]);
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  const countries = leadForm.phoneCountries
    .filter(isPhoneCountry)
    .map((code) => ({ code, name: regionNames.of(code) ?? code, dial: dialCode(code) }));
  const types = country.types.map((type) => ({
    type: type.type,
    label: tTypes(`${type.type}.label`),
    embassyFee: type.embassyFee,
    serviceCharge: type.serviceCharge,
  }));

  return (
    <main id="main" className="site-container flex flex-col gap-6 pt-4 pb-28 md:pt-6">
      <Breadcrumbs
        items={[
          { label: t("breadcrumb"), href: "/visa-services" },
          { label: country.name, href: `/visa-services/${country.slug}` },
          { label: t("apply.breadcrumb") },
        ]}
      />
      <header className="flex max-w-3xl flex-col gap-3">
        <p className="text-[13px] font-bold tracking-[0.14em] text-brand-700 uppercase">
          {t("apply.kicker", { country: country.name })}
        </p>
        <h1 className="font-display text-[30px] leading-[1.1] font-extrabold tracking-tight text-balance text-navy-900 md:text-[42px]">
          {t("apply.title", { country: country.name })}
        </h1>
        <p className="text-[16px] leading-relaxed text-mist-700">{t("apply.lead")}</p>
      </header>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <NextIntlClientProvider messages={pickMessages(messages, ["Visa", "Leads"])}>
            <VisaApplyRequest
              country={{ slug: country.slug, name: country.name }}
              types={types}
              officeDays={contact.officeHours.days}
              officeAddress={contact.addressLines.join(", ")}
              countries={countries}
              emailRequired={leadForm.emailRequired}
              consentText={leadForm.consentText}
              phoneDisplay={contact.phoneDisplay}
              whatsappE164={contact.whatsappE164}
            />
          </NextIntlClientProvider>
        </div>
        <HelpCard pageName={t("apply.title", { country: country.name })} />
      </div>
    </main>
  );
}

/** Params resolve inside Suspense, so navigations get an instant shell (Next 16 Cache Components). */
export default function VisaApplyPage({
  params,
}: PageProps<"/[locale]/visa-services/[country]/apply">) {
  return (
    <Suspense
      fallback={
        <main
          id="main"
          aria-busy="true"
          className="site-container flex flex-col gap-6 pt-4 pb-28 md:pt-6"
        >
          <Skeleton className="h-5 w-56 rounded-full" />
          <Skeleton className="h-[320px] rounded-[20px] md:h-[440px]" />
          <Skeleton className="h-10 w-3/4 rounded-xl" />
          <Skeleton className="h-[480px] rounded-2xl" />
        </main>
      }
    >
      <VisaApplyPageContent params={params} />
    </Suspense>
  );
}
