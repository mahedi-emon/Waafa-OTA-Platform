import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { ArrowRight } from "@/components/icons/server/ArrowRight";
import { Mail } from "@/components/icons/server/Mail";
import { MapPin } from "@/components/icons/server/MapPin";
import { Phone } from "@/components/icons/server/Phone";
import { contactPhones, whatsappLink } from "@waafa/shared";
import { PageHero } from "@/components/content/PageHero";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { OfficeStatusChip } from "@/components/layout/OfficeStatusChip";
import { Canonical } from "@/components/seo/Canonical";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/button";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import { pickMessages } from "@/i18n/pickMessages";
import { getContactSettings, getLeadFormSettings, getSiteSettings } from "@/lib/data/settings";
import { dialCode, isPhoneCountry } from "@/lib/leads/phone";
import { absoluteUrl } from "@/lib/siteUrl";
import { ContactForm } from "./_components/ContactForm";
import { withSocial } from "@/lib/seo/withSocial";
import { ExploreMore } from "@/components/seo/ExploreMore";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Contact");
  return withSocial({ title: t("metaTitle"), description: t("metaDescription") });
}

/**
 * /contact (Contact, Contact-sent, Contact-m): four ways to reach a person (from Admin › Settings › Contact), the
 * message form (CNT reference), office hours with the live chip, and directions.
 */
export default async function ContactPage() {
  const [contact, site, leadForm, messages, t, tLayout] = await Promise.all([
    getContactSettings(),
    getSiteSettings(),
    getLeadFormSettings(),
    getMessages(),
    getTranslations("Contact"),
    getTranslations("Layout"),
  ]);
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  const countries = leadForm.phoneCountries
    .filter(isPhoneCountry)
    .map((code) => ({ code, name: regionNames.of(code) ?? code, dial: dialCode(code) }));
  const address = [...contact.addressLines, contact.city].join(", ");

  const channels = [
    {
      key: "call",
      icon: <Phone aria-hidden="true" />,
      title: t("channels.call", { phone: contact.phoneDisplay }),
      body: `${contact.officeHoursText}. ${t("channels.callBody")}`,
      href: `tel:${contact.phoneE164}`,
      external: false,
      // The other office numbers from Admin, each its own tel: link (issue 181).
      more: contactPhones(contact)
        .slice(1)
        .map((phone) => ({
          label: t("channels.call", { phone: phone.display }),
          href: `tel:${phone.e164}`,
        })),
    },
    {
      key: "whatsapp",
      icon: <WhatsAppIcon />,
      title: t("channels.whatsapp"),
      body: t("channels.whatsappBody"),
      href: whatsappLink(
        contact.whatsappE164,
        contact.whatsappMessage.replace("{page}", t("metaTitle")),
      ),
      external: true,
      more: [],
    },
    {
      key: "email",
      icon: <Mail aria-hidden="true" />,
      title: t("channels.email", { email: contact.email }),
      body: t("channels.emailBody"),
      href: `mailto:${contact.email}`,
      external: false,
      more: [],
    },
    {
      key: "visit",
      icon: <MapPin aria-hidden="true" />,
      title: t("channels.visit", { place: contact.visitLabel }),
      body: address,
      href: contact.mapUrl ?? "#office",
      external: Boolean(contact.mapUrl),
      more: [],
    },
  ];

  return (
    <main id="main" className="site-container flex flex-col gap-10 pt-4 pb-28 md:gap-14 md:pt-6">
      <Canonical path="/contact" />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TravelAgency",
          name: site.travelBrand,
          url: absoluteUrl("/"),
          telephone: contactPhones(contact).map((phone) => phone.e164),
          email: contact.email,
          address: {
            "@type": "PostalAddress",
            streetAddress: contact.addressLines.join(", "),
            addressLocality: contact.city,
            addressCountry: "BD",
          },
        }}
      />
      <div className="flex flex-col gap-6">
        <Breadcrumbs items={[{ label: t("kicker") }]} />
        <PageHero kicker={t("kicker")} title={t("title")} lead={t("lead")}>
          <OfficeStatusChip
            hours={contact.officeHours}
            pendingLabel={tLayout("checkingHours")}
            className="self-start"
          />
        </PageHero>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {channels.map((channel) => (
          <li
            key={channel.key}
            className="group relative flex h-full flex-col gap-2 rounded-2xl border border-mist-200 bg-white p-5 focus-within:ring-3 focus-within:ring-ring/40 hover:border-mist-300 hover:shadow-md"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-electric-50 text-brand-700 [&_svg]:size-5">
              {channel.icon}
            </span>
            {/* The title link covers the card; extra numbers sit above it as their own links (issue 181). */}
            <a
              href={channel.href}
              {...(channel.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="text-[16px] font-bold break-words text-navy-900 outline-none group-hover:text-brand-700 after:absolute after:inset-0 after:rounded-2xl after:content-['']"
            >
              {channel.title}
            </a>
            {channel.more.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative z-10 -my-1 inline-flex min-h-11 items-center self-start text-[16px] font-bold text-navy-900 outline-none hover:text-brand-700 focus-visible:underline"
              >
                {link.label}
              </a>
            ))}
            <span className="text-[14px] leading-relaxed text-mist-700">{channel.body}</span>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-10">
        <section
          aria-labelledby="contact-form-title"
          className="flex flex-col gap-4 rounded-[24px] border border-mist-200 bg-white p-5 md:p-8"
        >
          <div>
            <h2 id="contact-form-title" className="type-h3 text-navy-900">
              {t("form.title")}
            </h2>
            <p className="mt-1 text-[14.5px] text-mist-700">
              {t("form.lead")}{" "}
              <Link href="/" className="font-semibold text-brand-700 underline underline-offset-4">
                {t("form.searchLink")}
              </Link>
            </p>
          </div>
          <NextIntlClientProvider messages={pickMessages(messages, ["Contact"])}>
            <ContactForm countries={countries} whatsappE164={contact.whatsappE164} />
          </NextIntlClientProvider>
        </section>

        <aside id="office" aria-labelledby="contact-hours" className="flex flex-col gap-4">
          <section className="flex flex-col gap-3 rounded-[24px] bg-navy-900 p-6 text-white">
            <h2 id="contact-hours" className="font-display text-[20px] font-extrabold">
              {t("hours.title")}
            </h2>
            <dl className="flex flex-col gap-2 text-[15px]">
              <div className="flex justify-between gap-3 border-b border-white/15 pb-2">
                <dt className="text-white/80">{contact.officeHoursText}</dt>
              </div>
              <div className="flex justify-between gap-3 border-b border-white/15 pb-2">
                <dt className="text-white/80">{contact.closedText}</dt>
              </div>
            </dl>
            <p className="text-[14px] text-white/80">{t("hours.holidays")}</p>
            <p className="text-[14px] text-white/80">{t("hours.outOfHours")}</p>
            {contact.mapUrl ? (
              <Button asChild variant="white" className="self-start">
                <a href={contact.mapUrl} target="_blank" rel="noopener noreferrer">
                  <MapPin aria-hidden="true" />
                  {t("directions")}
                </a>
              </Button>
            ) : null}
          </section>
          <Link
            href="/faqs"
            className="group flex items-center justify-between gap-3 rounded-2xl border border-mist-200 bg-white p-5 outline-none hover:border-mist-300 focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <span className="text-[14.5px] text-ink-900">
              {t("faqs")} <span className="font-semibold text-brand-700">{t("faqsLink")}</span>
            </span>
            <ArrowRight
              aria-hidden="true"
              className="size-5 shrink-0 text-brand-700 transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </aside>
      </div>
      <ExploreMore groups={["packages", "visa", "routes"]} />
    </main>
  );
}
