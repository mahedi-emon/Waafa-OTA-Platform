import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarRange, Clock3, Lightbulb, Plane, Stamp } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { formatTaka } from "@waafa/shared";
import { BannerHero } from "@/components/content/BannerHero";
import { SampleBadge } from "@/components/content/SampleBadge";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { RouteArc } from "@/components/motion/RouteArc";
import { ItemListJsonLd } from "@/components/seo/ItemListJsonLd";
import { JsonLd } from "@/components/seo/JsonLd";
import { AirlineLogo } from "@/components/travel/AirlineLogo";
import { GroupFareCard } from "@/components/travel/GroupFareCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import {
  getAirport,
  getFlightRoute,
  listAirlines,
  listFlightRoutes,
  listGroupFares,
} from "@/lib/data/travel";
import { getVisaCountry } from "@/lib/data/visa";
import { recordRobots } from "@/lib/seo/indexing";
import { withSocial } from "@/lib/seo/withSocial";

export async function generateStaticParams() {
  const routes = await listFlightRoutes();
  return routes.map((route) => ({ route: route.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/flights/[route]">): Promise<Metadata> {
  const { route: slug } = await params;
  const route = await getFlightRoute(slug);
  if (!route) return {};
  const title = route.seo.title ?? route.title;
  const description = route.seo.description ?? route.intro;
  return withSocial(
    {
      title,
      description,
      alternates: { canonical: `/flights/${route.slug}` },
      ...recordRobots(route),
    },
    { image: { url: route.image.src, alt: route.image.alt } },
  );
}

/**
 * /flights/[route] (#99): a flight route landing page for search (Dhaka to Dubai flights), built from the admin's
 * Flight routes record: the facts travellers look up, the indicative from-fare, the group fares on the route, the
 * visa page, tips and questions, and a prefilled request. The route arc draws itself in the banner.
 */
async function FlightRouteContent({
  params,
}: Pick<PageProps<"/[locale]/flights/[route]">, "params">) {
  const { route: slug } = await params;
  const route = await getFlightRoute(slug);
  if (!route) notFound();

  const [from, to, airlines, fares, visa, routes, t, tFlights] = await Promise.all([
    getAirport(route.from),
    getAirport(route.to),
    listAirlines(),
    listGroupFares({ to: route.to }),
    route.visaCountrySlug ? getVisaCountry(route.visaCountrySlug) : Promise.resolve(null),
    listFlightRoutes(),
    getTranslations("Flights.routePage"),
    getTranslations("Flights"),
  ]);
  const fromCity = from?.city ?? route.from;
  const toCity = to?.city ?? route.to;
  const routeAirlines = route.airlineCodes.map(
    (code) => airlines.find((airline) => airline.code === code) ?? { code, name: code },
  );
  const routeFares = fares.filter((fare) => fare.from.iata === route.from).slice(0, 3);
  const others = routes.filter((item) => item.slug !== route.slug && item.popular);
  const requestHref = `/flights?from=${route.from}&to=${route.to}`;

  return (
    <main id="main" className="site-container flex flex-col gap-10 pt-4 pb-28 md:gap-14 md:pt-6">
      {route.faqs.length > 0 ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: route.faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: { "@type": "Answer", text: faq.answer },
            })),
          }}
        />
      ) : null}
      <div className="flex flex-col gap-6">
        <Breadcrumbs
          items={[{ label: tFlights("breadcrumb"), href: "/flights" }, { label: route.title }]}
        />
        <BannerHero
          id="route-title"
          kicker={t("kicker", { city: fromCity })}
          title={route.title}
          lead={route.intro}
          photo={route.image}
          aside={
            <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 text-navy-900 shadow-lg lg:ml-auto lg:max-w-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-[26px] leading-none font-extrabold tracking-tight">
                  {route.from}
                </p>
                <RouteArc
                  label={`${fromCity} → ${toCity}`}
                  className="w-auto max-w-[200px] min-w-0 flex-1 shrink lg:w-auto"
                />
                <p className="font-display text-[26px] leading-none font-extrabold tracking-tight">
                  {route.to}
                </p>
              </div>
              {route.fromPrice ? (
                <p className="text-[14px] text-mist-600">
                  {t("fromFare")}{" "}
                  <span className="font-display text-[24px] font-extrabold text-navy-900 tabular-nums">
                    {formatTaka(route.fromPrice)}
                  </span>{" "}
                  {t("perAdult")}
                </p>
              ) : null}
              <Link
                href={requestHref}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-[15px] font-semibold text-primary-foreground outline-none hover:bg-brand-700 focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                {t("request")}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <p className="text-[12.5px] text-mist-600">{t("indicative")}</p>
            </div>
          }
        />
        {route.sample ? (
          <div className="self-start">
            <SampleBadge label={t("sample")} />
          </div>
        ) : null}
      </div>

      <section aria-label={route.title} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex gap-3 rounded-2xl border border-mist-200 bg-white p-5">
          <Clock3 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-electric-600" />
          <div>
            <h2 className="text-[13px] font-semibold text-mist-600">{t("flightTime")}</h2>
            <p className="font-display text-[17px] font-bold text-navy-900">{route.flightTime}</p>
          </div>
        </div>
        <div className="flex gap-3 rounded-2xl border border-mist-200 bg-white p-5 sm:col-span-2">
          <Plane aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-electric-600" />
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold text-mist-600">{t("airlines")}</h2>
            <ul className="mt-1.5 flex flex-wrap gap-2">
              {routeAirlines.map((airline) => (
                <li
                  key={airline.code}
                  className="inline-flex items-center gap-2 rounded-full bg-mist-100 py-1 pr-3 pl-1 text-[13.5px] font-semibold text-navy-900"
                >
                  <AirlineLogo airline={airline} size="sm" className="rounded-full" />
                  {airline.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {route.bestTime ? (
          <div className="flex gap-3 rounded-2xl border border-mist-200 bg-white p-5 sm:col-span-3">
            <CalendarRange
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-electric-600"
            />
            <div>
              <h2 className="text-[13px] font-semibold text-mist-600">{t("bestTime")}</h2>
              <p className="text-[15px] leading-relaxed text-ink-900">{route.bestTime}</p>
            </div>
          </div>
        ) : null}
      </section>

      {routeFares.length > 0 ? (
        <section aria-labelledby="route-fares" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="route-fares" className="type-h2 text-navy-900">
                {t("groupFares")}
              </h2>
              <p className="mt-1 max-w-[60ch] text-[15px] text-mist-600">{t("groupFaresLead")}</p>
            </div>
            <Link
              href={`/flights/group-fares?to=${route.to}`}
              className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-semibold text-brand-700 hover:underline"
            >
              {tFlights("groupPage.breadcrumb")}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {routeFares.map((fare) => (
              <li key={fare.id}>
                <GroupFareCard fare={fare} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {route.tips.length > 0 ? (
        <section aria-labelledby="route-tips" className="flex flex-col gap-4">
          <h2 id="route-tips" className="type-h2 text-navy-900">
            {t("tips")}
          </h2>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {route.tips.map((tip) => (
              <li
                key={tip.title}
                className="flex reveal-on-view flex-col gap-2 rounded-2xl bg-mist-50 p-5"
              >
                <Lightbulb aria-hidden="true" className="size-5 text-electric-600" />
                <h3 className="font-display text-[16px] font-bold text-navy-900">{tip.title}</h3>
                <p className="text-[14.5px] leading-relaxed text-mist-700">{tip.body}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {visa ? (
        <section
          aria-labelledby="route-visa"
          className="grid grid-cols-1 items-center gap-4 rounded-[24px] bg-navy-900 p-6 text-white md:grid-cols-[auto_1fr_auto] md:p-8"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-cyan-400">
            <Stamp aria-hidden="true" className="size-6" />
          </span>
          <div>
            <h2 id="route-visa" className="type-h3">
              {t("visa", { country: visa.name })}
            </h2>
            <p className="mt-1 text-[15px] text-white/80">{t("visaLead")}</p>
          </div>
          <Link
            href={`/visa-services/${visa.slug}`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-navy-900 hover:bg-mist-100"
          >
            {t("visaAction")}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </section>
      ) : null}

      {route.faqs.length > 0 ? (
        <section aria-labelledby="route-faqs" className="flex flex-col gap-4">
          <h2 id="route-faqs" className="type-h2 text-navy-900">
            {t("faqs")}
          </h2>
          <Accordion type="multiple" className="rounded-2xl border border-mist-200 bg-white px-4">
            {route.faqs.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ) : null}

      {others.length > 0 ? (
        <nav aria-labelledby="route-more" className="flex flex-col gap-3">
          <ItemListJsonLd
            name={t("popular")}
            items={others.map((item) => ({ name: item.title, path: `/flights/${item.slug}` }))}
          />
          <h2 id="route-more" className="font-display text-[18px] font-bold text-navy-900">
            {t("popular")}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {others.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/flights/${item.slug}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-mist-200 bg-white px-4 text-[14px] font-semibold text-navy-900 transition-colors duration-150 hover:border-mist-300 hover:bg-mist-50"
                >
                  {item.title}
                  <ArrowRight aria-hidden="true" className="size-3.5 text-brand-700" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </main>
  );
}

/** Params resolve inside Suspense, so navigations get an instant shell (Next 16 Cache Components, D85). */
export default function FlightRoutePage({ params }: PageProps<"/[locale]/flights/[route]">) {
  return (
    <Suspense
      fallback={
        <div className="site-container flex flex-col gap-6 pt-6 pb-28" aria-hidden="true">
          <Skeleton className="h-6 w-56 rounded-full" />
          <Skeleton className="h-[320px] rounded-[28px]" />
        </div>
      }
    >
      <FlightRouteContent params={params} />
    </Suspense>
  );
}
