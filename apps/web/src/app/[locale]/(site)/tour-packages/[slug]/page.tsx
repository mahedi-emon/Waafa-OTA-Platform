import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Check, FileCheck2, MapPin, Users, X } from "lucide-react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { formatDate, formatTaka, whatsappLink } from "@waafa/shared";
import { GoldTriangle } from "@/components/brand/GoldTriangle";
import { SampleBadge } from "@/components/content/SampleBadge";
import { SectionHeading } from "@/components/content/SectionHeading";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SmartImage } from "@/components/media/SmartImage";
import { JsonLd } from "@/components/seo/JsonLd";
import { PackageCard } from "@/components/travel/PackageCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { pickMessages } from "@/i18n/pickMessages";
import { Link } from "@/i18n/navigation";
import { getContactSettings, getLeadFormSettings } from "@/lib/data/settings";
import { getPackage, listPackages, listRelatedPackages } from "@/lib/data/travel";
import { ANY_DATE } from "@/lib/leads/packageLeadForm";
import { dialCode, isPhoneCountry } from "@/lib/leads/phone";
import { absoluteUrl } from "@/lib/siteUrl";
import { BookingBar } from "./_components/BookingBar";
import { BookingCard } from "./_components/BookingCard";
import { ItineraryDays } from "./_components/ItineraryDays";
import { PackageBookingProvider } from "./_components/PackageBookingProvider";
import { PackageGallery } from "./_components/PackageGallery";
import { PackageQuery } from "./_components/PackageQuery";
import { ShareButton } from "./_components/ShareButton";

export async function generateStaticParams() {
  const { items } = await listPackages({ limit: 100 });
  return items.map((pkg) => ({ slug: pkg.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/tour-packages/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getPackage(slug);
  if (!pkg) return {};
  const title = pkg.seo.title ?? pkg.title;
  const description = pkg.seo.description ?? pkg.summary;
  return {
    title,
    description,
    alternates: { canonical: `/tour-packages/${pkg.slug}` },
    openGraph: { title, description, images: [{ url: pkg.cover.src, alt: pkg.cover.alt }] },
    ...(pkg.seo.noIndex ? { robots: { index: false } } : {}),
  };
}

const SECTIONS = [
  "overview",
  "itinerary",
  "included",
  "prices",
  "hotels",
  "terms",
  "faqs",
] as const;
const h2 = "font-display text-[22px] font-bold text-navy-900 md:text-[26px]";
const section = "flex scroll-mt-36 flex-col gap-5";

/**
 * /tour-packages/[slug] (PackageDetail, PackageDetail-m, -photos, -query, -done boards): gallery, facts, section
 * nav, highlights, day-by-day itinerary, inclusions, prices and departures, hotels, visa and terms, questions, the
 * inline query (FR-PKG-06) and related trips. A sticky booking card on desktop, a booking bar on phones.
 */
async function PackagePageContent({
  params,
}: Pick<PageProps<"/[locale]/tour-packages/[slug]">, "params">) {
  const { slug } = await params;
  const pkg = await getPackage(slug);
  if (!pkg) notFound();

  const [related, contact, leadForm, messages, t, tList] = await Promise.all([
    listRelatedPackages(slug),
    getContactSettings(),
    getLeadFormSettings(),
    getMessages(),
    getTranslations("Packages"),
    getTranslations("Home.packages"),
  ]);
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  const countries = leadForm.phoneCountries
    .filter(isPhoneCountry)
    .map((code) => ({ code, name: regionNames.of(code) ?? code, dial: dialCode(code) }));
  const departures = [
    ...pkg.departures.map((departure) => ({
      value: departure.date,
      label:
        departure.seatsLeft !== undefined
          ? t("detail.departureSeats", {
              date: formatDate(departure.date),
              count: departure.seatsLeft,
            })
          : formatDate(departure.date),
    })),
    ...(pkg.anyDate ? [{ value: ANY_DATE, label: t("detail.anyDateOption") }] : []),
  ];
  const images = [pkg.cover, ...pkg.gallery.filter((image) => image.src !== pkg.cover.src)];
  const whatsappHref = whatsappLink(
    contact.whatsappE164,
    t("detail.whatsappMessage", { title: pkg.title }),
  );
  const sections = SECTIONS.filter(
    (key) =>
      (key !== "hotels" || pkg.hotels.length > 0) &&
      (key !== "faqs" || pkg.faqs.length > 0) &&
      (key !== "terms" || pkg.visa || pkg.terms.length > 0),
  );
  const facts = [
    {
      icon: CalendarDays,
      label: t("detail.duration"),
      value: t("detail.durationValue", { days: pkg.durationDays, nights: pkg.durationNights }),
    },
    { icon: MapPin, label: t("detail.from"), value: t("detail.fromValue") },
    ...(pkg.groupSize ? [{ icon: Users, label: t("detail.groupSize"), value: pkg.groupSize }] : []),
    ...(pkg.visa
      ? [
          {
            icon: FileCheck2,
            label: t("detail.visa"),
            value: pkg.visa.needed ? t("detail.visaNeeded") : t("detail.visaNotNeeded"),
          },
        ]
      : []),
  ];
  const clientMessages = pickMessages(messages, ["Packages", "Leads"]);

  return (
    <main id="main" className="site-container flex flex-col gap-6 pt-4 pb-40 md:pt-6 lg:pb-24">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TouristTrip",
          name: pkg.title,
          description: pkg.summary,
          url: absoluteUrl(`/tour-packages/${pkg.slug}`),
          image: images.map((image) => image.src),
          touristType: pkg.categories,
          itinerary: {
            "@type": "ItemList",
            itemListElement: pkg.itinerary.map((day) => ({
              "@type": "ListItem",
              position: day.day,
              name: day.title,
              description: day.body,
            })),
          },
          offers: {
            "@type": "Offer",
            price: pkg.fromPrice,
            priceCurrency: "BDT",
            availability: "https://schema.org/InStock",
            url: absoluteUrl(`/tour-packages/${pkg.slug}`),
          },
        }}
      />
      <Breadcrumbs
        items={[{ label: t("breadcrumb"), href: "/tour-packages" }, { label: pkg.title }]}
      />
      <div className="flex flex-col">
        <PackageGallery
          images={images}
          title={pkg.title}
          labels={{
            all: t("detail.photos", { count: images.length }),
            gallery: t("detail.gallery"),
            previous: t("detail.previous"),
            next: t("detail.next"),
          }}
        />
      </div>

      <NextIntlClientProvider messages={clientMessages}>
        <PackageBookingProvider pkg={pkg}>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
            <div className="flex min-w-0 flex-col gap-12">
              <header className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {pkg.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex h-7 items-center gap-1.5 rounded-full bg-electric-50 px-3 text-[12.5px] font-semibold text-brand-700"
                    >
                      {tag === "best-seller" ? <GoldTriangle className="size-2.5" /> : null}
                      {tList(`tags.${tag}`)}
                    </span>
                  ))}
                  {pkg.sample ? <SampleBadge label={t("detail.sample")} /> : null}
                </div>
                <h1 className="font-display text-[30px] leading-[1.1] font-extrabold tracking-tight text-balance text-navy-900 md:text-[42px]">
                  {pkg.title}
                </h1>
                <p className="max-w-[68ch] text-[16px] leading-relaxed text-mist-700 md:text-[17px]">
                  {pkg.summary}
                </p>
                <div>
                  <ShareButton
                    title={pkg.title}
                    labels={{
                      share: t("detail.share"),
                      copied: t("detail.shareCopied"),
                      failed: t("detail.shareFailed"),
                    }}
                  />
                </div>
                <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {facts.map((fact) => (
                    <div
                      key={fact.label}
                      className="flex flex-col gap-1 rounded-2xl border border-mist-200 bg-white p-4"
                    >
                      <dt className="flex items-center gap-1.5 text-[13px] text-mist-600">
                        <fact.icon aria-hidden="true" className="size-4 text-brand-700" />
                        {fact.label}
                      </dt>
                      <dd className="text-[15px] font-semibold text-navy-900">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              </header>

              <nav
                aria-label={t("detail.sections.label")}
                className="sticky top-(--hdr-h) z-20 -mx-4 border-y border-mist-200 bg-white/95 backdrop-blur-md md:mx-0 md:rounded-2xl md:border"
              >
                <ul
                  tabIndex={0}
                  aria-label={t("detail.sections.label")}
                  className="flex [scrollbar-width:none] gap-1 overflow-x-auto px-3 py-1.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  {sections.map((key) => (
                    <li key={key} className="shrink-0">
                      <a
                        href={`#${key}`}
                        className="inline-flex h-11 items-center rounded-full px-3.5 text-[14px] font-semibold text-ink-900 outline-none hover:bg-mist-100 focus-visible:ring-3 focus-visible:ring-ring/40"
                      >
                        {t(`detail.sections.${key}`)}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <section id="overview" aria-labelledby="overview-title" className={section}>
                <h2 id="overview-title" className={h2}>
                  {t("detail.highlights")}
                </h2>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {pkg.highlights.map((highlight) => (
                    <li key={highlight.title} className="flex gap-3 rounded-2xl bg-mist-50 p-4">
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-electric-600 text-white">
                        <Check aria-hidden="true" className="size-4" />
                      </span>
                      <span>
                        <span className="block text-[15px] font-semibold text-navy-900">
                          {highlight.title}
                        </span>
                        <span className="block text-[14px] text-mist-700">{highlight.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section id="itinerary" aria-labelledby="itinerary-title" className={section}>
                <ItineraryDays
                  days={pkg.itinerary}
                  headingId="itinerary-title"
                  title={t("detail.itinerary")}
                  labels={{
                    day: String(t.raw("detail.day")),
                    expandAll: t("detail.expandAll"),
                    collapseAll: t("detail.collapseAll"),
                  }}
                />
              </section>

              <section id="included" aria-labelledby="included-title" className={section}>
                <h2 id="included-title" className={h2}>
                  {t("detail.sections.included")}
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {(
                    [
                      ["included", pkg.inclusions, Check, "bg-success-600"],
                      ["notIncluded", pkg.exclusions, X, "bg-mist-400"],
                    ] as const
                  ).map(([key, items, Icon, tone]) => (
                    <div key={key} className="rounded-2xl border border-mist-200 bg-white p-5">
                      <h3 className="mb-3 text-[16px] font-bold text-navy-900">
                        {t(`detail.${key}`)}
                      </h3>
                      <ul className="flex flex-col gap-2.5">
                        {items.map((item) => (
                          <li key={item} className="flex gap-2.5 text-[15px] text-ink-900">
                            <span
                              className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-white ${tone}`}
                            >
                              <Icon aria-hidden="true" className="size-3.5" />
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              <section id="prices" aria-labelledby="prices-title" className={section}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id="prices-title" className={h2}>
                    {t("detail.prices")}
                  </h2>
                  <span className="rounded-full bg-warning-50 px-3 py-1 text-[12.5px] font-semibold text-warning-700">
                    {t("detail.indicative")}
                  </span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
                  <table className="w-full text-left text-[15px]">
                    <thead className="bg-mist-50 text-[13px] text-mist-600">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-semibold">
                          {t("detail.sharing")}
                        </th>
                        <th scope="col" className="px-4 py-3 text-right font-semibold">
                          {t("detail.priceFrom")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-mist-200">
                      {pkg.prices.map((price) => (
                        <tr key={price.sharing}>
                          <th scope="row" className="px-4 py-3 font-normal">
                            <span className="block font-semibold text-navy-900">{price.label}</span>
                            <span className="block text-[13px] text-mist-600">{price.detail}</span>
                          </th>
                          <td className="px-4 py-3 text-right font-display text-[17px] font-bold whitespace-nowrap text-navy-900 tabular-nums">
                            {formatTaka(price.price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-[17px] font-bold text-navy-900">{t("detail.departures")}</h3>
                  <p className="text-[15px] text-mist-700">{t("detail.departuresLead")}</p>
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {pkg.departures.map((departure) => (
                      <li
                        key={departure.date}
                        className="flex flex-col rounded-xl border border-mist-200 bg-white px-4 py-3"
                      >
                        <span className="font-semibold text-navy-900">
                          {formatDate(departure.date)}
                        </span>
                        {departure.seatsLeft !== undefined ? (
                          <span className="text-[13px] font-semibold text-warning-700">
                            {t("detail.seatsLeft", { count: departure.seatsLeft })}
                          </span>
                        ) : null}
                      </li>
                    ))}
                    {pkg.anyDate ? (
                      <li className="flex flex-col rounded-xl border border-dashed border-electric-200 bg-electric-50 px-4 py-3">
                        <span className="font-semibold text-navy-900">{t("detail.anyDate")}</span>
                        <span className="text-[13px] text-mist-700">{t("detail.anyDateSub")}</span>
                      </li>
                    ) : null}
                  </ul>
                </div>
              </section>

              {pkg.hotels.length > 0 ? (
                <section id="hotels" aria-labelledby="hotels-title" className={section}>
                  <h2 id="hotels-title" className={h2}>
                    {t("detail.hotels")}
                  </h2>
                  <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {pkg.hotels.map((hotel) => (
                      <li
                        key={hotel.city}
                        className="overflow-hidden rounded-2xl border border-mist-200 bg-white"
                      >
                        {hotel.image ? (
                          <SmartImage
                            src={hotel.image.src}
                            alt={hotel.image.alt}
                            ratio="16/9"
                            sizes="(min-width: 768px) 360px, 100vw"
                          />
                        ) : null}
                        <div className="flex flex-col gap-1 p-4">
                          <p className="text-[13px] font-semibold text-brand-700">
                            {hotel.nightsLabel}
                          </p>
                          <h3 className="text-[16px] font-bold text-navy-900">{hotel.city}</h3>
                          <p className="text-[14.5px] text-mist-700">{hotel.description}</p>
                          <p className="text-[13px] text-mist-600">
                            {hotel.nameNote ?? t("detail.hotelNamed")}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {pkg.visa || pkg.terms.length > 0 ? (
                <section id="terms" aria-labelledby="terms-title" className={section}>
                  <h2 id="terms-title" className={h2}>
                    {t("detail.terms")}
                  </h2>
                  {pkg.visa ? (
                    <div className="flex gap-4 rounded-2xl bg-navy-900 p-5 text-white">
                      <FileCheck2
                        aria-hidden="true"
                        className="mt-0.5 size-6 shrink-0 text-cyan-400"
                      />
                      <div className="flex flex-col gap-1.5">
                        <h3 className="text-[16px] font-bold">{pkg.visa.title}</h3>
                        <p className="text-[15px] leading-relaxed text-white/80">{pkg.visa.body}</p>
                        {pkg.visa.countrySlug ? (
                          <Link
                            href={`/visa-services/${pkg.visa.countrySlug}`}
                            className="mt-1 self-start text-[15px] font-semibold text-cyan-400 underline underline-offset-4"
                          >
                            {t("detail.visaLink")}
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  {pkg.terms.length > 0 ? (
                    <ul className="flex list-disc flex-col gap-2 pl-5 text-[15px] leading-relaxed text-ink-900 marker:text-mist-400">
                      {pkg.terms.map((term) => (
                        <li key={term}>{term}</li>
                      ))}
                    </ul>
                  ) : null}
                  <Link
                    href="/refund-policy"
                    className="self-start text-[15px] font-semibold text-brand-700 underline underline-offset-4"
                  >
                    {t("detail.refundPolicy")}
                  </Link>
                </section>
              ) : null}

              {pkg.faqs.length > 0 ? (
                <section id="faqs" aria-labelledby="faqs-title" className={section}>
                  <h2 id="faqs-title" className={h2}>
                    {t("detail.faqs")}
                  </h2>
                  <Accordion
                    type="single"
                    collapsible
                    className="rounded-2xl border border-mist-200 bg-white px-5"
                  >
                    {pkg.faqs.map((faq) => (
                      <AccordionItem key={faq.question} value={faq.question}>
                        <AccordionTrigger>{faq.question}</AccordionTrigger>
                        <AccordionContent>
                          <p>{faq.answer}</p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
              ) : null}

              <section id="query" aria-label={t("query.title")} className="scroll-mt-28">
                <PackageQuery
                  pkg={{ id: pkg.id, title: pkg.title, prices: pkg.prices }}
                  departures={departures}
                  countries={countries}
                  emailRequired={leadForm.emailRequired}
                  consentText={leadForm.consentText}
                  phoneDisplay={contact.phoneDisplay}
                  whatsappE164={contact.whatsappE164}
                />
              </section>
            </div>

            <aside aria-label={t("detail.booking")} className="hidden lg:block">
              <div className="sticky top-[calc(var(--hdr-h)+16px)]">
                <BookingCard
                  fromPrice={pkg.fromPrice}
                  prices={pkg.prices}
                  departures={departures}
                  whatsappHref={whatsappHref}
                />
              </div>
            </aside>
          </div>
          <BookingBar fromPrice={pkg.fromPrice} />
        </PackageBookingProvider>
      </NextIntlClientProvider>

      {related.length > 0 ? (
        <section aria-labelledby="related-title" className="flex flex-col gap-6 pt-6">
          <SectionHeading
            id="related-title"
            kicker={t("detail.relatedKicker")}
            title={t("detail.related")}
            action={{ href: "/tour-packages", label: t("detail.allPackages") }}
          />
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.slice(0, 3).map((item) => (
              <li key={item.id}>
                <PackageCard
                  pkg={item}
                  sizes="(min-width: 1024px) 400px, (min-width: 640px) 45vw, 100vw"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

/** Params resolve inside Suspense, so navigations get an instant shell (Next 16 Cache Components). */
export default function PackagePage({ params }: PageProps<"/[locale]/tour-packages/[slug]">) {
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
      <PackagePageContent params={params} />
    </Suspense>
  );
}
