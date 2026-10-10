import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Lightbulb } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { formatDate, formatTaka } from "@waafa/shared";
import { RichText } from "@/components/content/RichText";
import { SampleBadge } from "@/components/content/SampleBadge";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SmartImage } from "@/components/media/SmartImage";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { getVisaCountry, getVisaGuide, listVisaGuides } from "@/lib/data/visa";
import { absoluteUrl } from "@/lib/siteUrl";

export async function generateStaticParams() {
  const guides = await listVisaGuides();
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/visa-guide/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getVisaGuide(slug);
  if (!guide) return {};
  const title = guide.seo.title ?? guide.title;
  const description = guide.seo.description ?? guide.summary;
  return {
    title,
    description,
    alternates: { canonical: `/visa-guide/${guide.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      images: [{ url: guide.cover.src, alt: guide.cover.alt }],
    },
    ...(guide.seo.noIndex ? { robots: { index: false } } : {}),
  };
}

/**
 * /visa-guide/[slug] (VisaGuidePost, VisaGuidePost-m boards): an article with an "On this page" list, the visa desk's
 * tips, the country's fees and questions, and a way into the visa service for that country.
 */
async function VisaGuidePostPageContent({
  params,
}: Pick<PageProps<"/[locale]/visa-guide/[slug]">, "params">) {
  const { slug } = await params;
  const guide = await getVisaGuide(slug);
  if (!guide) notFound();
  const [country, t, tVisa, tTypes] = await Promise.all([
    getVisaCountry(guide.countrySlug),
    getTranslations("Visa.guide"),
    getTranslations("Visa"),
    getTranslations("Search.visaTypes"),
  ]);
  const firstType = country?.types[0];
  const countryName = country?.name ?? guide.title;

  return (
    <main id="main" className="site-container flex flex-col gap-8 pt-4 pb-28 md:pt-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guide.title,
          description: guide.summary,
          image: [guide.cover.src],
          dateModified: guide.updatedAt,
          author: { "@type": "Organization", name: t("byline") },
          mainEntityOfPage: absoluteUrl(`/visa-guide/${guide.slug}`),
        }}
      />
      <Breadcrumbs
        items={[{ label: t("breadcrumb"), href: "/visa-guide" }, { label: countryName }]}
      />
      <header className="flex max-w-3xl flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[13px] font-bold tracking-[0.14em] text-brand-700 uppercase">
            {t("kicker")} · {countryName}
          </p>
          {guide.sample ? <SampleBadge label={t("sampleArticle")} /> : null}
        </div>
        <h1 className="font-display text-[30px] leading-[1.1] font-extrabold tracking-tight text-balance text-navy-900 md:text-[42px]">
          {guide.title}
        </h1>
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-full bg-navy-900 font-display text-[13px] font-extrabold text-white"
          >
            {t("bylineInitials")}
          </span>
          <p className="text-[14px] leading-tight">
            <span className="block font-semibold text-navy-900">{t("byline")}</span>
            <span className="text-mist-600">
              {t("meta", { minutes: guide.readingMinutes, date: formatDate(guide.updatedAt) })}
            </span>
          </p>
        </div>
      </header>

      <SmartImage
        src={guide.cover.src}
        alt={guide.cover.alt}
        ratio="21/9"
        sizes="(min-width: 1280px) 1200px, 100vw"
        preload
        className="rounded-[20px]"
      />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-14">
        <nav
          aria-label={t("contents")}
          className="lg:sticky lg:top-[calc(var(--hdr-h)+16px)] lg:self-start"
        >
          <p className="mb-2 text-[13px] font-bold tracking-[0.12em] text-mist-600 uppercase">
            {t("contents")}
          </p>
          <ol className="flex flex-col border-l border-mist-200">
            {guide.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="-ml-px flex min-h-11 items-center border-l-2 border-transparent pl-4 text-[14.5px] font-medium text-ink-900 outline-none hover:border-electric-600 hover:text-navy-900 focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="flex max-w-[72ch] min-w-0 flex-col gap-8">
          <p className="text-[18px] leading-relaxed text-mist-700">{guide.summary}</p>
          {guide.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-title`}
              className="flex scroll-mt-28 flex-col gap-3"
            >
              <h2
                id={`${section.id}-title`}
                className="font-display text-[22px] font-bold text-navy-900"
              >
                {section.heading}
              </h2>
              <RichText html={section.body} />
            </section>
          ))}

          {firstType ? (
            <section
              aria-labelledby="guide-fees"
              className="flex flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5"
            >
              <h2 id="guide-fees" className="font-display text-[18px] font-bold text-navy-900">
                {t("feesTitle", { type: tTypes(`${firstType.type}.label`) })}
              </h2>
              <dl className="flex flex-col gap-2 text-[15px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-mist-700">{tVisa("country.embassyFee")}</dt>
                  <dd className="font-semibold text-ink-900 tabular-nums">
                    {firstType.embassyFee === null
                      ? tVisa("country.confirmedLater")
                      : formatTaka(firstType.embassyFee)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-mist-700">{tVisa("country.serviceCharge")}</dt>
                  <dd className="font-semibold text-ink-900 tabular-nums">
                    {formatTaka(firstType.serviceCharge)}
                  </dd>
                </div>
              </dl>
              {country?.sample ? (
                <p className="text-[12.5px] font-semibold text-warning-700">{tVisa("sample")}</p>
              ) : null}
            </section>
          ) : null}

          {guide.tips.length > 0 ? (
            <aside aria-labelledby="guide-tips" className="flex gap-3 rounded-2xl bg-mist-50 p-5">
              <Lightbulb aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-700" />
              <div className="flex flex-col gap-2">
                <h2 id="guide-tips" className="text-[16px] font-bold text-navy-900">
                  {t("tips")}
                </h2>
                <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] text-ink-900 marker:text-mist-400">
                  {guide.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            </aside>
          ) : null}

          {country && country.faqs.length > 0 ? (
            <section aria-labelledby="guide-faqs" className="flex flex-col gap-4">
              <h2 id="guide-faqs" className="font-display text-[22px] font-bold text-navy-900">
                {t("faqs")}
              </h2>
              <Accordion
                type="single"
                collapsible
                className="rounded-2xl border border-mist-200 bg-white px-5"
              >
                {country.faqs.map((faq) => (
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

          {country ? (
            <section
              aria-labelledby="guide-service"
              className="flex flex-col gap-3 rounded-[20px] bg-navy-900 p-6 text-white"
            >
              <h2 id="guide-service" className="font-display text-[22px] font-extrabold">
                {t("serviceTitle", { country: country.name })}
              </h2>
              <p className="text-[15px] text-white/80">{t("serviceBody")}</p>
              <Button asChild variant="white" className="self-start">
                <Link href={`/visa-services/${country.slug}`}>
                  {t("service", { country: country.name })}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </section>
          ) : null}
        </article>
      </div>
    </main>
  );
}

/** Params resolve inside Suspense, so navigations get an instant shell (Next 16 Cache Components). */
export default function VisaGuidePostPage({ params }: PageProps<"/[locale]/visa-guide/[slug]">) {
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
      <VisaGuidePostPageContent params={params} />
    </Suspense>
  );
}
