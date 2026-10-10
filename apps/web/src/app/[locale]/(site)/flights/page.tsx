import { Suspense } from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { formatDate, formatTaka, type FlightSearch, type GroupFare } from "@waafa/shared";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { GroupFaresRail } from "@/components/results/GroupFaresRail";
import { HelpCard } from "@/components/results/HelpCard";
import { LivePlaceholder } from "@/components/results/LivePlaceholder";
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
import {
  getGroupFare,
  listAirlines,
  listFeaturedAirlines,
  listPinnedAirports,
} from "@/lib/data/travel";
import { loadFlightSearch, parseFlightValues } from "@/lib/search/flightParams";
import { formatFieldDate } from "@/lib/search/isoDate";
import { isPhoneCountry, dialCode } from "@/lib/leads/phone";
import { FlightRequest, type GroupFareSummary } from "./_components/FlightRequest";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Flights");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "/flights" },
  };
}

/** A group fare as the search it stands for, so the request is prefilled from the fare. */
function searchFromFare(fare: GroupFare): FlightSearch {
  return {
    tripType: fare.tripType === "return" ? "round-trip" : "one-way",
    legs: [{ from: fare.from.iata, to: fare.to.iata, date: fare.departDate }],
    ...(fare.returnDate ? { returnDate: fare.returnDate } : {}),
    travellers: { adults: 1, childAges: [], infants: 0 },
    cabin: fare.cabin,
    preferredAirline: fare.airline.code,
    directOnly: fare.stops === 0,
    flexibleDates: false,
    fareType: "regular",
  };
}

async function FlightsResults({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const fareId = typeof params.groupFare === "string" ? params.groupFare : undefined;
  // A link may carry only part of a search (a banner's ?to=KUL): prefill what it has, from Dhaka by default.
  const raw = (key: string) => {
    const value = params[key];
    return typeof value === "string" ? value.trim() : "";
  };
  const partial = {
    from: /^[A-Za-z]{3}$/.test(raw("from")) ? raw("from").toUpperCase() : undefined,
    to: /^[A-Za-z]{3}$/.test(raw("to")) ? raw("to").toUpperCase() : undefined,
    depart: /^\d{4}-\d{2}-\d{2}$/.test(raw("depart")) ? raw("depart") : undefined,
  };
  const [
    parsed,
    fare,
    config,
    contact,
    leadForm,
    searchSettings,
    pinned,
    airlines,
    featured,
    messages,
    t,
    tSearch,
  ] = await Promise.all([
    Promise.resolve(parseFlightValues(loadFlightSearch(params))),
    fareId ? getGroupFare(fareId) : Promise.resolve(null),
    getPublicConfig(),
    getContactSettings(),
    getLeadFormSettings(),
    getSearchSettings(),
    listPinnedAirports(),
    listAirlines(),
    listFeaturedAirlines(),
    getMessages(),
    getTranslations("Flights"),
    getTranslations("Search"),
  ]);
  const search: FlightSearch | null = fare
    ? searchFromFare(fare)
    : parsed.success
      ? parsed.data
      : null;
  const first = search?.legs[0];
  const travellers = search
    ? search.travellers.adults + search.travellers.childAges.length + search.travellers.infants
    : 0;
  const route = search
    ? search.tripType === "multi-city"
      ? [first?.from, ...search.legs.map((leg) => leg.to)].join(" → ")
      : `${first?.from} ${search.tripType === "round-trip" ? "⇄" : "→"} ${first?.to}`
    : t("summary.empty");
  const details = search
    ? [
        first ? formatFieldDate(first.date) : null,
        search.returnDate ? formatFieldDate(search.returnDate) : null,
        t("summary.travellers", { count: travellers }),
        tSearch(`cabins.${search.cabin}`),
      ]
        .filter(Boolean)
        .join(" · ")
    : t("summary.emptySub");
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  const countries = leadForm.phoneCountries
    .filter(isPhoneCountry)
    .map((code) => ({ code, name: regionNames.of(code) ?? code, dial: dialCode(code) }));
  const groupFare: GroupFareSummary | null = fare
    ? {
        id: fare.id,
        title: `${fare.airline.name} · ${fare.from.city} to ${fare.to.city} · ${formatDate(fare.departDate)}`,
        meta: `${tSearch(`cabins.${fare.cabin}`)} · ${fare.baggage}${
          fare.seatsLeft !== undefined
            ? ` · ${t("groupFare.seatsLeft", { count: fare.seatsLeft })}`
            : ""
        }`,
        price: formatTaka(fare.farePerAdult),
        date: fare.departDate,
      }
    : null;
  const airportOptions = [...pinned.map((a) => ({ iata: a.iata, city: a.city }))];
  for (const code of search?.legs.flatMap((leg) => [leg.from, leg.to]) ?? []) {
    if (!airportOptions.some((a) => a.iata === code))
      airportOptions.push({ iata: code, city: code });
  }

  return (
    <div className="flex flex-col gap-6">
      <TripSummaryBar
        route={route}
        details={details}
        labels={{ region: t("summary.label"), edit: t("summary.edit"), close: t("summary.close") }}
      >
        <SearchCard source="flights" initialFlight={search} />
      </TripSummaryBar>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-10">
          <ResultsBody
            mode={config.modes.flights.mode}
            manual={
              <NextIntlClientProvider messages={pickMessages(messages, ["Flights", "Leads"])}>
                <FlightRequest
                  search={search}
                  prefill={
                    search
                      ? undefined
                      : {
                          ...partial,
                          from:
                            partial.from ?? (partial.to ? searchSettings.defaultOrigin : undefined),
                        }
                  }
                  groupFare={groupFare}
                  airports={airportOptions}
                  airlines={airlines.map(({ code, name }) => ({ code, name }))}
                  preferenceAirlines={featured
                    .slice(0, 8)
                    .map(({ code, name }) => ({ code, name }))}
                  countries={countries}
                  emailRequired={leadForm.emailRequired}
                  consentText={leadForm.consentText}
                  phoneDisplay={contact.phoneDisplay}
                  whatsappE164={contact.whatsappE164}
                  officeHours={contact.officeHours}
                />
              </NextIntlClientProvider>
            }
            live={<LivePlaceholder />}
          />
          <GroupFaresRail to={first?.to} excludeId={fare?.id} />
        </div>
        <HelpCard pageName={t("breadcrumb")} />
      </div>
    </div>
  );
}

function FlightsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <Skeleton className="h-[72px] rounded-2xl" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Skeleton className="h-[560px] rounded-[20px]" />
        <Skeleton className="hidden h-[360px] rounded-2xl lg:block" />
      </div>
    </div>
  );
}

/** /flights (Flights, Flights-m boards): the results shell with the Manual request; Live arrives in Phase E. */
export default async function FlightsPage({ searchParams }: PageProps<"/[locale]/flights">) {
  const t = await getTranslations("Flights");
  return (
    <main id="main" className="site-container flex flex-col gap-4 pt-4 pb-28 md:pt-6">
      <Breadcrumbs items={[{ label: t("breadcrumb") }]} />
      <h1 className="sr-only">{t("card.title")}</h1>
      <Suspense fallback={<FlightsSkeleton />}>
        <FlightsResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
