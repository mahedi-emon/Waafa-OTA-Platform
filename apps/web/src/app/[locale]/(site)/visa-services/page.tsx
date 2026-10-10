import { Suspense } from "react";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { VisaRegionSchema, whatsappLink, type VisaRegion } from "@waafa/shared";
import { SampleBadge } from "@/components/content/SampleBadge";
import { SectionHeading } from "@/components/content/SectionHeading";
import { EmptyState } from "@/components/feedback/EmptyState";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VisaCountryCard } from "@/components/visa/VisaCountryCard";
import { Link } from "@/i18n/navigation";
import { cn } from "cn";
import { listFaqs } from "@/lib/data/content";
import { getContactSettings } from "@/lib/data/settings";
import { listVisaCountries } from "@/lib/data/visa";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Visa");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "/visa-services" },
  };
}

type Params = Record<string, string | string[] | undefined>;

/** "/visa-services?region=europe&q=fra", leaving out empty values. */
function listHref(region: VisaRegion | undefined, query: string): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (region) params.set("region", region);
  const search = params.toString();
  return search ? `/visa-services?${search}` : "/visa-services";
}

async function VisaResults({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 60) : "";
  const regionParam = typeof params.region === "string" ? params.region : undefined;
  const region = VisaRegionSchema.safeParse(regionParam).success
    ? (regionParam as VisaRegion)
    : undefined;
  const [countries, all, contact, t] = await Promise.all([
    listVisaCountries({ ...(query ? { search: query } : {}), ...(region ? { region } : {}) }),
    listVisaCountries(),
    getContactSettings(),
    getTranslations("Visa"),
  ]);
  const regions = VisaRegionSchema.options.filter((value) =>
    all.some((country) => country.region === value),
  );
  const popular = all.filter((country) => country.popular);

  return (
    <div className="flex flex-col gap-5">
      <form method="get" role="search" className="flex max-w-xl gap-2">
        {region ? <input type="hidden" name="region" value={region} /> : null}
        <label className="sr-only" htmlFor="visa-search">
          {t("list.search")}
        </label>
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-mist-500"
          />
          <input
            id="visa-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder={t("list.searchPlaceholder")}
            autoComplete="off"
            className="h-12 w-full rounded-full border border-mist-300 bg-white pr-4 pl-11 text-base text-ink-900 outline-none focus-visible:border-electric-600 focus-visible:ring-3 focus-visible:ring-ring/20"
          />
        </div>
        <Button type="submit">{t("list.searchButton")}</Button>
      </form>
      {popular.length > 0 ? (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-mist-600">
          {t("list.popular")}
          {popular.map((country) => (
            <Link
              key={country.slug}
              href={`/visa-services/${country.slug}`}
              className="inline-flex min-h-11 items-center font-semibold text-brand-700 underline-offset-4 hover:underline"
            >
              {country.name}
            </Link>
          ))}
        </p>
      ) : null}
      <nav aria-label={t("list.regionsLabel")}>
        <ul className="flex flex-wrap gap-2">
          {[undefined, ...regions].map((value) => {
            const current = value === region;
            const count = value
              ? all.filter((country) => country.region === value).length
              : all.length;
            return (
              <li key={value ?? "all"}>
                <Link
                  href={listHref(value, query)}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[14px] font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                    current
                      ? "border-navy-900 bg-navy-900 text-white"
                      : "border-mist-200 bg-white text-ink-900 hover:border-mist-300",
                  )}
                >
                  {value ? t(`regions.${value}`) : t("list.allRegions")}
                  <span
                    className={cn(
                      "text-[12px] tabular-nums",
                      current ? "text-white/70" : "text-mist-500",
                    )}
                  >
                    {count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-[18px] font-bold text-navy-900">
          {t("list.count", { count: countries.length })}
        </h2>
        {countries.some((country) => country.sample) ? <SampleBadge label={t("sample")} /> : null}
      </div>
      {countries.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {countries.map((country) => (
            <li key={country.slug}>
              <VisaCountryCard
                country={country}
                submissionLabel={t(`submission.${country.submission}`)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Search}
          title={t("list.emptyTitle", { query: query || t(`regions.${region ?? "europe"}`) })}
          description={t("list.emptyBody")}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild variant="whatsapp">
                <a
                  href={whatsappLink(
                    contact.whatsappE164,
                    t("list.emptyMessage", { query: query || "" }),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon className="size-5" />
                  {t("list.emptyWhatsapp")}
                </a>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/visa-services">{t("list.emptyAll")}</Link>
              </Button>
            </div>
          }
        />
      )}
    </div>
  );
}

/** /visa-services (Visa, Visa-none, Visa-m boards): search, regions, country cards, how it works and questions. */
export default async function VisaServicesPage({
  searchParams,
}: PageProps<"/[locale]/visa-services">) {
  const [faqs, t] = await Promise.all([listFaqs({ category: "visa" }), getTranslations("Visa")]);
  const steps = (["one", "two", "three", "four"] as const).map((key) => ({
    title: t(`list.steps.${key}Title`),
    body: t(`list.steps.${key}Body`),
  }));

  return (
    <main id="main" className="site-container flex flex-col gap-12 pt-4 pb-28 md:pt-6">
      <div className="flex flex-col gap-6">
        <Breadcrumbs items={[{ label: t("breadcrumb") }]} />
        <header className="flex max-w-3xl flex-col gap-3">
          <p className="text-[13px] font-bold tracking-[0.14em] text-brand-700 uppercase">
            {t("list.kicker")}
          </p>
          <h1 className="font-display text-[32px] leading-[1.08] font-extrabold tracking-tight text-balance text-navy-900 md:text-[46px]">
            {t("list.title")}
          </h1>
          <p className="text-[16px] leading-relaxed text-mist-700 md:text-[18px]">
            {t("list.lead")}
          </p>
        </header>
        <Suspense
          fallback={
            <div className="flex flex-col gap-4" aria-hidden="true">
              <Skeleton className="h-12 max-w-xl rounded-full" />
              <Skeleton className="h-[480px] rounded-2xl" />
            </div>
          }
        >
          <VisaResults searchParams={searchParams} />
        </Suspense>
      </div>

      <section
        aria-labelledby="visa-how"
        className="flex flex-col gap-6 rounded-[24px] bg-navy-900 p-6 text-white md:p-10"
      >
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-bold tracking-[0.14em] text-cyan-400 uppercase">
            {t("list.howKicker")}
          </p>
          <h2
            id="visa-how"
            className="font-display text-[26px] leading-tight font-extrabold md:text-[32px]"
          >
            {t("list.howTitle")}
          </h2>
          <p className="max-w-2xl text-[15px] text-white/80">{t("list.howLead")}</p>
        </div>
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-3 rounded-2xl bg-white/8 p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white font-display text-[15px] font-extrabold text-navy-900 tabular-nums">
                {index + 1}
              </span>
              <span>
                <span className="block text-[15px] font-semibold">{step.title}</span>
                <span className="block text-[14px] text-white/75">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {faqs.length > 0 ? (
        <section aria-labelledby="visa-faqs" className="flex flex-col gap-5">
          <SectionHeading
            id="visa-faqs"
            kicker={t("list.faqKicker")}
            title={t("list.faqTitle")}
            action={{ href: "/visa-guide", label: t("list.guides") }}
          />
          <Accordion
            type="single"
            collapsible
            className="rounded-2xl border border-mist-200 bg-white px-5"
          >
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>
                  {faq.answer.split(/\n\s*\n/).map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ) : null}
    </main>
  );
}
