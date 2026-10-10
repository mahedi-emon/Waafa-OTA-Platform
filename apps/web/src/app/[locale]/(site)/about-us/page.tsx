import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRight, MapPin, Phone } from "lucide-react";
import { InfoCard } from "@/components/content/InfoCard";
import { PageHero } from "@/components/content/PageHero";
import { RichText } from "@/components/content/RichText";
import { SampleBadge } from "@/components/content/SampleBadge";
import { RibbonLine } from "@/components/brand/RibbonLine";
import { MenuIcon } from "@/components/icons/MenuIcon";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { OfficeStatusChip } from "@/components/layout/OfficeStatusChip";
import { SmartImage } from "@/components/media/SmartImage";
import { Canonical } from "@/components/seo/Canonical";
import { TeamCard } from "@/components/team/TeamCard";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  getMediaSlot,
  getPage,
  listDestinations,
  listPageBlocks,
  listTeam,
  listTimeline,
  listValues,
} from "@/lib/data/content";
import { getContactSettings, getHomeContent } from "@/lib/data/settings";

export async function generateMetadata(): Promise<Metadata> {
  const [page, t] = await Promise.all([getPage("about-us"), getTranslations("About")]);
  return {
    title: page?.seo.title ?? t("metaTitle"),
    description: page?.seo.description ?? t("metaDescription"),
  };
}

/**
 * /about-us (About, About-m): the company story, what each brand does, popular routes, the journey, values, the team
 * grid (initials until real photos) and the office. Everything comes from Admin: the page record, page blocks,
 * timeline, values, team and contact settings.
 */
export default async function AboutPage() {
  const [page, blocks, destinations, timeline, values, team, contact, home, office, t, tLayout] =
    await Promise.all([
      getPage("about-us"),
      listPageBlocks("about"),
      listDestinations(),
      listTimeline(),
      listValues(),
      listTeam("about"),
      getContactSettings(),
      getHomeContent(),
      getMediaSlot("office"),
      getTranslations("About"),
      getTranslations("Layout"),
    ]);
  if (!page) notFound();
  const services = blocks.filter((block) => block.group === "services");
  const routes = blocks.find((block) => block.group === "routes");
  const officeImage = office?.image ?? office?.video?.poster;

  return (
    <main id="main" className="site-container flex flex-col gap-16 pt-4 pb-28 md:gap-20 md:pt-6">
      <Canonical path="/about-us" />
      <div className="flex flex-col gap-6">
        <Breadcrumbs items={[{ label: t("kicker") }]} />
        <section className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
          <PageHero
            kicker={t("kicker")}
            title={page.title}
            lead={page.summary}
            aside={page.sample ? <SampleBadge label={tLayout("sample")} /> : null}
            actions={
              <>
                <Button asChild size="lg">
                  <a href="#visit">
                    <MapPin aria-hidden="true" />
                    {t("visit")}
                  </a>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/tour-packages">
                    {t("tours")}
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </>
            }
          />
          <figure className="relative flex flex-col gap-2">
            {officeImage ? (
              <SmartImage
                src={officeImage.src}
                alt={officeImage.alt}
                ratio="4/3"
                sizes="(min-width: 1024px) 560px, 100vw"
                preload
                frameClassName="rounded-3xl bg-mist-100"
              />
            ) : (
              // No stand-in photo: until the team uploads its own office photos, the slot shows the visit card.
              <div className="flex aspect-[4/3] flex-col justify-between rounded-3xl bg-navy-900 p-6 text-white md:p-8">
                <RibbonLine className="w-24" />
                <div className="flex flex-col gap-2">
                  <p className="font-display text-[40px] leading-none font-extrabold md:text-[52px]">
                    {home.why.figure}
                  </p>
                  <p className="max-w-[28ch] text-[15px] text-white/80">{home.why.figureLabel}</p>
                </div>
                <address className="text-[14.5px] leading-relaxed text-white/85 not-italic">
                  {contact.addressLines.join(", ")}, {contact.city}
                  <span className="mt-1 block text-white/70">{contact.officeHoursText}</span>
                </address>
              </div>
            )}
            {officeImage ? (
              <p className="absolute bottom-4 left-4 flex flex-col rounded-2xl bg-white/95 px-4 py-3 shadow-md">
                <span className="font-display text-[22px] leading-none font-extrabold text-navy-900">
                  {home.why.figure}
                </span>
                <span className="text-[12.5px] text-mist-700">{home.why.figureLabel}</span>
              </p>
            ) : null}
            {officeImage?.credit ? (
              <figcaption className="text-[12px] text-mist-600">
                {t("photoCredit", { credit: officeImage.credit })}
              </figcaption>
            ) : null}
          </figure>
        </section>
      </div>

      {services.length > 0 ? (
        <section aria-labelledby="about-what" className="flex flex-col gap-6">
          <h2 id="about-what" className="type-h2 text-navy-900">
            {t("whatWeDo")}
          </h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((block) => (
              <li key={block.id}>
                <InfoCard block={block} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {routes ? (
        <section
          aria-labelledby="about-routes"
          className="grid grid-cols-1 gap-6 rounded-[24px] bg-navy-900 p-6 text-white md:p-10 lg:grid-cols-[1fr_1.2fr] lg:items-center"
        >
          <div className="flex flex-col gap-3">
            <p className="text-[13px] font-bold tracking-[0.14em] text-cyan-400 uppercase">
              {t("routesKicker")}
            </p>
            <h2 id="about-routes" className="type-h2">
              {routes.title}
            </h2>
            <p className="max-w-[52ch] text-[15.5px] leading-relaxed text-white/80">
              {routes.body}
            </p>
            {routes.link ? (
              <Button asChild variant="white" className="self-start">
                <Link href={routes.link.href}>
                  {routes.link.label}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            ) : null}
          </div>
          {destinations.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {destinations.map((destination) => (
                <li
                  key={destination.id}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-white/8 px-4 text-[14px] font-semibold text-white"
                >
                  <span className="font-display text-[12px] tracking-wider text-cyan-400 tabular-nums">
                    {destination.iata}
                  </span>
                  {destination.name}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <section
        aria-labelledby="about-story"
        className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14"
      >
        <div className="flex flex-col gap-6">
          <h2 id="about-story" className="type-h2 text-navy-900">
            {t("storyTitle")}
          </h2>
          {page.sections.map((section) => (
            <div key={section.id} id={section.id} className="flex scroll-mt-28 flex-col gap-2">
              <h3 className="font-display text-[18px] font-bold text-navy-900">
                {section.heading}
              </h3>
              <RichText html={section.body} />
            </div>
          ))}
        </div>
        {timeline.length > 0 ? (
          <ol className="relative flex flex-col gap-6 self-start border-l-2 border-mist-200 pl-6">
            {timeline.map((event) => (
              <li key={event.id} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 -left-[33px] size-4 rounded-full border-[3px] border-white bg-electric-600 ring-1 ring-electric-200"
                />
                <p className="font-display text-[16px] font-extrabold text-navy-900 tabular-nums">
                  {event.period}
                </p>
                <p className="text-[15px] leading-snug text-mist-700">{event.text}</p>
              </li>
            ))}
          </ol>
        ) : null}
      </section>

      {values.length > 0 ? (
        <section aria-labelledby="about-values" className="flex flex-col gap-6">
          <h2 id="about-values" className="type-h2 text-navy-900">
            {t("valuesTitle")}
          </h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value) => (
              <li
                key={value.id}
                className="flex flex-col gap-2 rounded-2xl border border-mist-200 bg-white p-5"
              >
                <span
                  aria-hidden="true"
                  className="grid size-10 place-items-center rounded-xl bg-electric-50 text-brand-700"
                >
                  <MenuIcon name={value.icon} className="size-5" />
                </span>
                <h3 className="font-display text-[17px] font-bold text-navy-900">{value.title}</h3>
                <p className="text-[14.5px] leading-relaxed text-mist-700">{value.body}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {team.length > 0 ? (
        <section
          id="team"
          aria-labelledby="about-team"
          className="flex scroll-mt-28 flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[13px] font-bold tracking-[0.14em] text-brand-700 uppercase">
                {t("teamKicker")}
              </p>
              {team.some((member) => member.sample) ? (
                <SampleBadge label={t("sampleTeam")} title={t("sampleTeamNote")} />
              ) : null}
            </div>
            <h2 id="about-team" className="type-h2 text-navy-900">
              {t("teamTitle")}
            </h2>
            <p className="max-w-[60ch] text-[15.5px] text-mist-700">{t("teamLead")}</p>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {team.map((member) => (
              <li key={member.id}>
                <TeamCard member={member} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section
        id="visit"
        aria-labelledby="about-visit"
        className="grid scroll-mt-28 grid-cols-1 gap-6 rounded-[24px] border border-mist-200 bg-white p-6 md:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center"
      >
        <div className="flex flex-col gap-3">
          <p className="text-[13px] font-bold tracking-[0.14em] text-brand-700 uppercase">
            {t("visitKicker")}
          </p>
          <h2 id="about-visit" className="type-h2 text-navy-900">
            {contact.addressLines[0]}
          </h2>
          <address className="text-[15.5px] leading-relaxed text-mist-700 not-italic">
            {contact.addressLines.slice(1).join(", ")}, {contact.city}
          </address>
          <p className="text-[15.5px] text-mist-700">
            {contact.officeHoursText}. {t("visitLead")}
          </p>
          <OfficeStatusChip hours={contact.officeHours} pendingLabel={tLayout("checkingHours")} />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Button asChild size="lg">
            <a href={`tel:${contact.phoneE164}`}>
              <Phone aria-hidden="true" />
              {t("call", { phone: contact.phoneDisplay })}
            </a>
          </Button>
          {contact.mapUrl ? (
            <Button asChild size="lg" variant="secondary">
              <a href={contact.mapUrl} target="_blank" rel="noopener noreferrer">
                <MapPin aria-hidden="true" />
                {t("directions")}
              </a>
            </Button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
