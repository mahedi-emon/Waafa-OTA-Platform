import { Suspense } from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { HelpCard } from "@/components/results/HelpCard";
import { Skeleton } from "@/components/ui/skeleton";
import { pickMessages } from "@/i18n/pickMessages";
import { getContactSettings, getLeadFormSettings, getSearchSettings } from "@/lib/data/settings";
import { dialCode, isPhoneCountry } from "@/lib/leads/phone";
import { PlanTripRequest } from "./_components/PlanTripRequest";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("PlanTrip");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "/plan-my-trip" },
  };
}

async function PlanTripCard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const place = typeof params.place === "string" ? params.place.trim().slice(0, 60) : undefined;
  const [contact, leadForm, search, messages] = await Promise.all([
    getContactSettings(),
    getLeadFormSettings(),
    getSearchSettings(),
    getMessages(),
  ]);
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  const countries = leadForm.phoneCountries
    .filter(isPhoneCountry)
    .map((code) => ({ code, name: regionNames.of(code) ?? code, dial: dialCode(code) }));

  return (
    <NextIntlClientProvider messages={pickMessages(messages, ["PlanTrip", "Leads"])}>
      <PlanTripRequest
        {...(place ? { place } : {})}
        places={search.planTripPlaces}
        countries={countries}
        emailRequired={leadForm.emailRequired}
        consentText={leadForm.consentText}
        phoneDisplay={contact.phoneDisplay}
        whatsappE164={contact.whatsappE164}
      />
    </NextIntlClientProvider>
  );
}

/** /plan-my-trip (PlanTrip, PlanTrip-m, -done boards): how it works, then the two-step custom trip request. */
export default async function PlanMyTripPage({
  searchParams,
}: PageProps<"/[locale]/plan-my-trip">) {
  const t = await getTranslations("PlanTrip");
  const steps = [
    { title: t("how.oneTitle"), body: t("how.oneBody") },
    { title: t("how.twoTitle"), body: t("how.twoBody") },
    { title: t("how.threeTitle"), body: t("how.threeBody") },
  ];

  return (
    <main id="main" className="site-container flex flex-col gap-8 pt-4 pb-28 md:pt-6">
      <Breadcrumbs items={[{ label: t("breadcrumb") }]} />
      <header className="flex max-w-3xl flex-col gap-3">
        <p className="text-[13px] font-bold tracking-[0.14em] text-brand-700 uppercase">
          {t("breadcrumb")}
        </p>
        <h1 className="font-display text-[32px] leading-[1.08] font-extrabold tracking-tight text-balance text-navy-900 md:text-[46px]">
          {t("title")}
        </h1>
        <p className="text-[16px] leading-relaxed text-mist-700 md:text-[18px]">{t("lead")}</p>
      </header>
      <ol aria-label={t("how.label")} className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="flex gap-3 rounded-2xl border border-mist-200 bg-white p-4"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-navy-900 font-display text-[15px] font-extrabold text-white tabular-nums">
              {index + 1}
            </span>
            <span>
              <span className="block text-[15px] font-semibold text-navy-900">{step.title}</span>
              <span className="block text-[14px] text-mist-600">{step.body}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <Suspense fallback={<Skeleton className="h-[560px] rounded-[20px]" />}>
            <PlanTripCard searchParams={searchParams} />
          </Suspense>
        </div>
        <HelpCard pageName={t("breadcrumb")} />
      </div>
    </main>
  );
}
