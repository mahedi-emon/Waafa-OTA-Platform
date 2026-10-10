import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookOpen, FileDown, Info } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SampleBadge } from "@/components/content/SampleBadge";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CountryCode } from "@/components/search/CountryCode";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { getContactSettings } from "@/lib/data/settings";
import { getVisaCountry, listVisaCountries } from "@/lib/data/visa";
import { VisaChecklist } from "./_components/VisaChecklist";
import { VisaFeeBar } from "./_components/VisaFeeBar";
import { VisaFeeCard, type VisaFee } from "./_components/VisaFeeCard";
import { VisaTypeProvider } from "./_components/VisaTypeProvider";
import { VisaTypeTabs } from "./_components/VisaTypeTabs";

export async function generateStaticParams() {
  const countries = await listVisaCountries();
  return countries.map((country) => ({ country: country.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/visa-services/[country]">): Promise<Metadata> {
  const { country: slug } = await params;
  const [country, t] = await Promise.all([getVisaCountry(slug), getTranslations("Visa.country")]);
  if (!country) return {};
  const title = country.seo.title ?? t("title", { country: country.name });
  const description = country.seo.description ?? t("lead");
  return {
    title,
    description,
    alternates: { canonical: `/visa-services/${country.slug}` },
    ...(country.seo.noIndex ? { robots: { index: false } } : {}),
  };
}

const h2 = "font-display text-[22px] font-bold text-navy-900";

/**
 * /visa-services/[country] (VisaCountry, VisaCountry-medical, VisaCountry-m boards): a tab per visa type with facts
 * and the documents checklist, forms, notes, questions, and a fee card (a bar on phones) that follows the tab.
 */
async function VisaCountryPageContent({
  params,
}: Pick<PageProps<"/[locale]/visa-services/[country]">, "params">) {
  const { country: slug } = await params;
  const country = await getVisaCountry(slug);
  if (!country) notFound();
  const [contact, t, tTypes] = await Promise.all([
    getContactSettings(),
    getTranslations("Visa"),
    getTranslations("Search.visaTypes"),
  ]);
  const fees: VisaFee[] = country.types.map((type) => ({
    type: type.type,
    label: tTypes(`${type.type}.label`),
    embassyFee: type.embassyFee,
    serviceCharge: type.serviceCharge,
  }));
  const notes = [...new Set(country.types.flatMap((type) => type.notes))];

  const tabs = country.types.map((type) => {
    const facts = [
      { label: t("country.processing"), value: type.processingTime },
      ...(type.stay ? [{ label: t("country.stay"), value: type.stay }] : []),
      ...(type.entry ? [{ label: t("country.entry"), value: type.entry }] : []),
      ...(type.validity ? [{ label: t("country.validity"), value: type.validity }] : []),
    ];
    return {
      type: type.type,
      label: tTypes(`${type.type}.label`),
      panel: (
        <div className="flex flex-col gap-6">
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="flex flex-col gap-1 rounded-2xl border border-mist-200 bg-white p-4"
              >
                <dt className="text-[13px] text-mist-600">{fact.label}</dt>
                <dd className="text-[15px] font-semibold text-navy-900">{fact.value}</dd>
              </div>
            ))}
          </dl>
          <VisaChecklist
            items={type.checklist}
            labels={{
              title: t("country.documents"),
              hint: t("country.readyLabel"),
              ready: t("country.ready", { done: "{done}", total: "{total}" }),
              allReady: t("country.allReady"),
            }}
          />
        </div>
      ),
    };
  });

  return (
    <main id="main" className="site-container flex flex-col gap-6 pt-4 pb-40 md:pt-6 lg:pb-24">
      {country.faqs.length > 0 ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: country.faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: { "@type": "Answer", text: faq.answer },
            })),
          }}
        />
      ) : null}
      <Breadcrumbs
        items={[{ label: t("breadcrumb"), href: "/visa-services" }, { label: country.name }]}
      />
      <VisaTypeProvider types={country.types.map((type) => type.type)}>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
          <div className="flex min-w-0 flex-col gap-10">
            <header className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <CountryCode code={country.flagCode} />
                <p className="text-[13px] font-bold tracking-[0.14em] text-brand-700 uppercase">
                  {t("country.kicker", { country: country.name })}
                </p>
                <span className="rounded-full bg-mist-100 px-2.5 py-1 text-[12px] font-semibold text-ink-900">
                  {t(`submission.${country.submission}`)}
                </span>
                {country.sample ? <SampleBadge label={t("sample")} /> : null}
              </div>
              <h1 className="font-display text-[30px] leading-[1.1] font-extrabold tracking-tight text-balance text-navy-900 md:text-[42px]">
                {t("country.title", { country: country.name })}
              </h1>
              <p className="max-w-[68ch] text-[16px] leading-relaxed text-mist-700">
                {t("country.lead")}
              </p>
            </header>

            <VisaTypeTabs label={t("country.typesLabel")} tabs={tabs} />

            {country.forms.length > 0 ? (
              <section aria-labelledby="visa-forms" className="flex flex-col gap-4">
                <h2 id="visa-forms" className={h2}>
                  {t("country.forms")}
                </h2>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {country.forms.map((form) => (
                    <li key={form.url}>
                      <a
                        href={form.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-14 items-center gap-3 rounded-2xl border border-mist-200 bg-white px-4 text-[15px] font-semibold text-navy-900 outline-none hover:border-mist-300 focus-visible:ring-3 focus-visible:ring-ring/40"
                      >
                        <FileDown aria-hidden="true" className="size-5 text-brand-700" />
                        {form.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section aria-labelledby="visa-notes" className="flex flex-col gap-4">
              <h2 id="visa-notes" className={h2}>
                {t("country.notes")}
              </h2>
              <div className="flex gap-3 rounded-2xl bg-mist-50 p-5">
                <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-700" />
                <div className="flex flex-col gap-2">
                  <h3 className="text-[16px] font-bold text-navy-900">{t("country.rulesTitle")}</h3>
                  <p className="text-[15px] leading-relaxed text-mist-700">
                    {t("country.rulesBody")}
                  </p>
                  {notes.length > 0 ? (
                    <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] text-ink-900 marker:text-mist-400">
                      {notes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  ) : null}
                  {country.guideSlug ? (
                    <Link
                      href={`/visa-guide/${country.guideSlug}`}
                      className="mt-1 inline-flex min-h-11 items-center gap-2 self-start text-[15px] font-semibold text-brand-700 underline underline-offset-4"
                    >
                      <BookOpen aria-hidden="true" className="size-4" />
                      {t("country.guide", { country: country.name })}
                    </Link>
                  ) : null}
                </div>
              </div>
            </section>

            {country.faqs.length > 0 ? (
              <section aria-labelledby="visa-country-faqs" className="flex flex-col gap-4">
                <h2 id="visa-country-faqs" className={h2}>
                  {t("country.faqs")}
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
          </div>

          <aside aria-label={t("country.feeLabel")} className="hidden lg:block">
            <div className="sticky top-[calc(var(--hdr-h)+16px)]">
              <VisaFeeCard
                slug={country.slug}
                fees={fees}
                whatsappE164={contact.whatsappE164}
                sample={country.sample}
                labels={{
                  title: t("country.feeTitle", { country: country.name, type: "{type}" }),
                  perApplicant: t("country.perApplicant"),
                  embassyFee: t("country.embassyFee"),
                  serviceCharge: t("country.serviceCharge"),
                  total: t("country.total"),
                  confirmedLater: t("country.confirmedLater"),
                  apply: t("country.apply"),
                  whatsapp: t("country.whatsapp"),
                  whatsappMessage: t("country.whatsappMessage", {
                    country: country.name,
                    type: "{type}",
                  }),
                  payLater: t("country.payLater"),
                  sample: t("sample"),
                }}
              />
            </div>
          </aside>
        </div>
        <VisaFeeBar
          slug={country.slug}
          fees={fees}
          labels={{
            line: t("country.barLine", { type: "{type}" }),
            total: t("country.barTotal", { total: "{total}" }),
            apply: t("country.applyShort"),
          }}
        />
      </VisaTypeProvider>
    </main>
  );
}

/** Params resolve inside Suspense, so navigations get an instant shell (Next 16 Cache Components). */
export default function VisaCountryPage({
  params,
}: PageProps<"/[locale]/visa-services/[country]">) {
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
      <VisaCountryPageContent params={params} />
    </Suspense>
  );
}
