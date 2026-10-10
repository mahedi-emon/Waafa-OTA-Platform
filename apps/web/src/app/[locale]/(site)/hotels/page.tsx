import { Suspense } from "react";
import type { Metadata } from "next";
import { CloudOff } from "lucide-react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { daysBetween } from "@waafa/shared";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { HelpCard } from "@/components/results/HelpCard";
import { ResultsBody } from "@/components/results/ResultsBody";
import { TripSummaryBar } from "@/components/results/TripSummaryBar";
import { SearchCard } from "@/components/search/SearchCard";
import { Skeleton } from "@/components/ui/skeleton";
import { pickMessages } from "@/i18n/pickMessages";
import {
  getContactSettings,
  getLeadFormSettings,
  getPublicConfig,
  getSearchSettings,
} from "@/lib/data/settings";
import { dialCode, isPhoneCountry } from "@/lib/leads/phone";
import { loadHotelSearch, parseHotelValues } from "@/lib/search/hotelParams";
import { formatFieldDate } from "@/lib/search/isoDate";
import { HotelRequest } from "./_components/HotelRequest";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Hotels");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "/hotels" },
  };
}

async function HotelResults({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const [parsed, config, contact, leadForm, searchSettings, messages, t] = await Promise.all([
    Promise.resolve(parseHotelValues(loadHotelSearch(params))),
    getPublicConfig(),
    getContactSettings(),
    getLeadFormSettings(),
    getSearchSettings(),
    getMessages(),
    getTranslations("Hotels"),
  ]);
  const search = parsed.success ? parsed.data : null;
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  const countries = leadForm.phoneCountries
    .filter(isPhoneCountry)
    .map((code) => ({ code, name: regionNames.of(code) ?? code, dial: dialCode(code) }));
  const nationalities = searchSettings.hotelNationalities.map((code) => ({
    code,
    name: regionNames.of(code) ?? code,
  }));
  const adults = search ? search.rooms.reduce((sum, room) => sum + room.adults, 0) : 0;
  const details = search
    ? [
        `${formatFieldDate(search.checkIn)} – ${formatFieldDate(search.checkOut)}`,
        t("summary.nights", { count: daysBetween(search.checkIn, search.checkOut) }),
        t("summary.roomsGuests", { rooms: search.rooms.length, adults }),
      ].join(" · ")
    : t("summary.emptySub");

  return (
    <div className="flex flex-col gap-6">
      <TripSummaryBar
        route={search?.placeLabel ?? t("summary.empty")}
        details={details}
        labels={{ region: t("summary.label"), edit: t("summary.edit"), close: t("summary.close") }}
      >
        <SearchCard source="hotels" initialHotel={search} />
      </TripSummaryBar>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <ResultsBody
            mode={config.modes.hotels.mode}
            manual={
              <NextIntlClientProvider messages={pickMessages(messages, ["Hotels", "Leads"])}>
                <HotelRequest
                  search={search}
                  nationalities={nationalities}
                  countries={countries}
                  emailRequired={leadForm.emailRequired}
                  consentText={leadForm.consentText}
                  phoneDisplay={contact.phoneDisplay}
                  whatsappE164={contact.whatsappE164}
                />
              </NextIntlClientProvider>
            }
            live={
              <EmptyState icon={CloudOff} title={t("card.title")} description={t("card.lead")} />
            }
          />
        </div>
        <HelpCard pageName={t("breadcrumb")} />
      </div>
    </div>
  );
}

/** /hotels (Hotels, Hotels-m boards): the shared results shell with the Manual hotel request. */
export default async function HotelsPage({ searchParams }: PageProps<"/[locale]/hotels">) {
  const t = await getTranslations("Hotels");
  return (
    <main id="main" className="site-container flex flex-col gap-4 pt-4 pb-28 md:pt-6">
      <Breadcrumbs items={[{ label: t("breadcrumb") }]} />
      <h1 className="sr-only">{t("card.title")}</h1>
      <Suspense
        fallback={
          <div className="flex flex-col gap-6" aria-hidden="true">
            <Skeleton className="h-[72px] rounded-2xl" />
            <Skeleton className="h-[560px] rounded-[20px]" />
          </div>
        }
      >
        <HotelResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
