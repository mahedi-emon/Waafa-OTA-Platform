import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Check } from "lucide-react";
import { whatsappLink, type ServicePage } from "@waafa/shared";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SmartImage } from "@/components/media/SmartImage";
import { SmartVideo } from "@/components/media/SmartVideo";
import { Canonical } from "@/components/seo/Canonical";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { getContactSettings, getSiteSettings } from "@/lib/data/settings";
import { getMediaSlot } from "@/lib/data/content";

type ServicePageViewProps = {
  page: ServicePage;
  path: string;
  /** The request card (PrintingRequest or TradingRequest). */
  form: ReactNode;
};

/**
 * A Waafa International service page (Printing, Trading): hero with facts and a photo or loop, services, how it
 * works, the request card with a side photo, and questions. Every text and image comes from the ServicePage record
 * and its media slots.
 */
async function ServicePageView({ page, path, form }: ServicePageViewProps) {
  const [site, contact, header, side, t] = await Promise.all([
    getSiteSettings(),
    getContactSettings(),
    getMediaSlot(page.headerSlot),
    getMediaSlot(page.formSlot),
    getTranslations("Services"),
  ]);
  const headerImage = header?.image;
  const sideImage = side?.image ?? side?.video?.poster;

  return (
    <main id="main" className="site-container flex flex-col gap-12 pt-4 pb-28 md:gap-16 md:pt-6">
      <Canonical path={path} />
      {page.questions.length > 0 ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: page.questions.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }}
        />
      ) : null}

      <div className="flex flex-col gap-6">
        <Breadcrumbs items={[{ label: site.storeName, href: "/shop" }, { label: page.title }]} />
        <section
          aria-labelledby="service-title"
          className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12"
        >
          <div className="flex flex-col gap-4">
            <p className="text-[13px] font-bold tracking-[0.14em] text-brand-700 uppercase">
              {page.kicker}
            </p>
            <h1
              id="service-title"
              className="font-display text-[34px] leading-[1.05] font-extrabold tracking-tight text-balance text-navy-900 md:text-[48px]"
            >
              {page.title}
            </h1>
            <p className="max-w-[56ch] text-[16px] leading-relaxed text-mist-700">{page.lead}</p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild size="lg">
                <a href="#request">
                  {page.primaryCta}
                  <ArrowRight aria-hidden="true" />
                </a>
              </Button>
              <Button asChild size="lg" variant="whatsapp">
                <a
                  href={whatsappLink(contact.whatsappE164, page.whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon />
                  {t("whatsapp")}
                </a>
              </Button>
            </div>
            {page.facts.length > 0 ? (
              <dl className="mt-3 grid grid-cols-1 gap-4 border-t border-mist-200 pt-5 sm:grid-cols-3">
                {page.facts.map((fact) => (
                  <div key={fact.value}>
                    <dt className="font-display text-[18px] font-extrabold text-navy-900">
                      {fact.value}
                    </dt>
                    <dd className="text-[13.5px] text-mist-700">{fact.label}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
          <div className="relative overflow-hidden rounded-3xl bg-mist-100">
            {header?.video ? (
              <SmartVideo
                sources={{
                  mp4: header.video.mp4,
                  ...(header.video.webm ? { webm: header.video.webm } : {}),
                  ...(header.video.mp4Mobile ? { mp4Mobile: header.video.mp4Mobile } : {}),
                  ...(header.video.webmMobile ? { webmMobile: header.video.webmMobile } : {}),
                }}
                poster={header.video.poster.src}
                alt={header.video.poster.alt}
                sizes="(min-width: 1024px) 560px, 100vw"
                preloadPoster
                className="aspect-[4/3]"
              />
            ) : headerImage ? (
              <SmartImage
                src={headerImage.src}
                alt={headerImage.alt}
                ratio="4/3"
                sizes="(min-width: 1024px) 560px, 100vw"
                preload
              />
            ) : (
              <div className="aspect-[4/3]" />
            )}
          </div>
        </section>
      </div>

      <section aria-labelledby="service-what" className="flex flex-col gap-6">
        <h2
          id="service-what"
          className="font-display text-[26px] font-extrabold text-navy-900 md:text-[32px]"
        >
          {page.servicesTitle}
        </h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {page.services.map((service) => (
            <li
              key={service.title}
              className="flex flex-col gap-2 rounded-2xl border border-mist-200 bg-white p-5"
            >
              <span
                aria-hidden="true"
                className="grid size-9 place-items-center rounded-full bg-electric-50 text-brand-700"
              >
                <Check className="size-4" />
              </span>
              <h3 className="font-display text-[17px] font-bold text-navy-900">{service.title}</h3>
              <p className="text-[14.5px] leading-relaxed text-mist-700">{service.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="service-how" className="flex flex-col gap-6">
        <div>
          <p className="text-[13px] font-bold tracking-[0.14em] text-brand-700 uppercase">
            {t("how")}
          </p>
          <h2
            id="service-how"
            className="font-display text-[26px] font-extrabold text-navy-900 md:text-[32px]"
          >
            {page.stepsTitle}
          </h2>
        </div>
        <ol className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {page.steps.map((step, index) => (
            <li key={step.title} className="flex gap-3 rounded-2xl bg-mist-50 p-5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-navy-900 font-display text-[14px] font-bold text-white">
                {index + 1}
              </span>
              <span>
                <span className="block text-[15.5px] font-semibold text-navy-900">
                  {step.title}
                </span>
                <span className="mt-0.5 block text-[14px] text-mist-700">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section
        id="request"
        aria-labelledby="service-form"
        className="grid scroll-mt-28 grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]"
      >
        <div className="flex min-w-0 flex-col gap-4">
          <h2 id="service-form" className="sr-only">
            {page.formTitle}
          </h2>
          {form}
        </div>
        {sideImage ? (
          <div className="hidden overflow-hidden rounded-3xl lg:block">
            <SmartImage
              src={sideImage.src}
              alt={sideImage.alt}
              ratio="3/4"
              sizes="360px"
              className="h-full object-cover"
            />
          </div>
        ) : null}
      </section>

      {page.questions.length > 0 ? (
        <section aria-labelledby="service-questions" className="flex flex-col gap-4">
          <h2
            id="service-questions"
            className="font-display text-[26px] font-extrabold text-navy-900 md:text-[32px]"
          >
            {t("questions")}
          </h2>
          <Accordion
            type="single"
            collapsible
            className="max-w-3xl rounded-2xl border border-mist-200 bg-white px-5"
          >
            {page.questions.map((item) => (
              <AccordionItem key={item.question} value={item.question}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>
                  <p>{item.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ) : null}
    </main>
  );
}

export { ServicePageView };
