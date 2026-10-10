import type { ReactNode } from "react";
import {
  Building2,
  Clock,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Route,
  Smartphone,
  Truck,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { whatsappLink, type MenuItem, type PaymentMethodBadge } from "@waafa/shared";
import { FacebookIcon } from "@/components/icons/FacebookIcon";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Link } from "@/i18n/navigation";
import {
  getContactSettings,
  getFooterSettings,
  getMenu,
  getSiteSettings,
} from "@/lib/data/settings";
import { getCurrentYear } from "@/lib/currentYear";
import { DeveloperCredit } from "./DeveloperCredit";
import { FooterAccordion } from "./FooterAccordion";
import { NewsletterForm } from "./NewsletterForm";
import { OfficeStatusChip } from "./OfficeStatusChip";

const PAYMENT_ICONS: Record<PaymentMethodBadge["id"], ReactNode> = {
  bank: <Landmark aria-hidden="true" />,
  bkash: <Smartphone aria-hidden="true" />,
  nagad: <Smartphone aria-hidden="true" />,
  office: <Building2 aria-hidden="true" />,
  cod: <Truck aria-hidden="true" />,
  card: <Landmark aria-hidden="true" />,
  sslcommerz: <Landmark aria-hidden="true" />,
};

function FooterLinks({ items }: { items: MenuItem[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {items
        .filter((item) => item.visible && item.href)
        .map((item) => (
          <li key={item.id}>
            <Link
              href={item.href ?? "/"}
              className="inline-flex min-h-9 items-center text-[15px] text-mist-700 transition-colors duration-150 hover:text-navy-900 focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              {item.label}
            </Link>
          </li>
        ))}
    </ul>
  );
}

function FooterHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-sans text-[13px] font-bold tracking-[0.1em] text-navy-900 uppercase">
      {children}
    </h2>
  );
}

/**
 * Dynamic footer (Footer board, FR-FTR-01..07): every link, label and contact line comes from Settings › Footer and
 * menus; payment methods appear only while live; the developer credit is code. Light (mist-50) so the full-colour
 * logo stays legible (D9). Phones collapse the link columns into accordions.
 */
async function SiteFooter() {
  const [site, contact, footer, legal, year, t, tl] = await Promise.all([
    getSiteSettings(),
    getContactSettings(),
    getFooterSettings(),
    getMenu("legal"),
    getCurrentYear(),
    getTranslations("Footer"),
    getTranslations("Layout"),
  ]);
  const columns = await Promise.all(
    footer.columns.map(async (column) => ({ ...column, menu: await getMenu(column.menu) })),
  );
  const livePayments = footer.paymentMethods.filter((method) => method.enabled);

  const socials = (
    <ul className="flex gap-2">
      {contact.socials.map((social) => (
        <li key={social.network}>
          <a
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("socialLabel", { network: social.network })}
            className="grid size-11 place-items-center rounded-full border border-mist-200 bg-white text-navy-900 transition-colors duration-150 hover:border-mist-300 hover:bg-mist-25 focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            {social.network === "facebook" ? <FacebookIcon /> : null}
          </a>
        </li>
      ))}
      <li>
        <a
          href={whatsappLink(contact.whatsappE164)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={tl("whatsappChat")}
          className="grid size-11 place-items-center rounded-full border border-mist-200 bg-white text-navy-900 transition-colors duration-150 hover:border-mist-300 hover:bg-mist-25 focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <WhatsAppIcon />
        </a>
      </li>
      <li>
        <a
          href={`mailto:${contact.email}`}
          aria-label={t("emailUs")}
          className="grid size-11 place-items-center rounded-full border border-mist-200 bg-white text-navy-900 transition-colors duration-150 hover:border-mist-300 hover:bg-mist-25 focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <Mail aria-hidden="true" className="size-[18px]" />
        </a>
      </li>
    </ul>
  );

  return (
    <footer className="mt-auto bg-mist-50">
      <div aria-hidden="true" className="h-1 bg-(image:--ribbon)" />
      <div className="site-container flex flex-col gap-10 pt-12 pb-24 lg:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,2.4fr)_minmax(0,1.15fr)] lg:gap-8">
          <div className="flex flex-col gap-4">
            {/* Correction 4: one WAAFA logo per page (the header); the footer names the brand in text. */}
            <p className="font-display text-[22px] font-extrabold tracking-tight text-navy-900">
              {site.travelBrand}
            </p>
            <p className="font-display text-[17px] font-bold tracking-tight text-navy-900">
              {site.footerTagline}
            </p>
            <p className="max-w-[44ch] text-[15px] leading-relaxed text-mist-700">
              {site.footerAbout}
            </p>
            {socials}
          </div>

          <nav aria-label={t("nav")} className="lg:grid lg:grid-cols-3 lg:gap-8">
            {columns.map((column) => (
              <div key={column.menu?.key ?? column.title} className="hidden flex-col gap-4 lg:flex">
                <FooterHeading>{column.title}</FooterHeading>
                <FooterLinks items={column.menu?.items ?? []} />
              </div>
            ))}
            <div className="lg:hidden">
              <FooterAccordion
                columns={columns.map((column) => ({
                  id: column.menu?.key ?? column.title,
                  title: column.title,
                  links: <FooterLinks items={column.menu?.items ?? []} />,
                }))}
              />
            </div>
          </nav>

          <address className="flex flex-col gap-4 not-italic">
            <FooterHeading>{t("visitOrCall")}</FooterHeading>
            <ul className="flex flex-col gap-3.5 text-[15px] text-mist-700">
              <li className="flex gap-3">
                <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-700" />
                <span>
                  {contact.addressLines.join(", ")}, {contact.city}
                </span>
              </li>
              <li className="flex gap-3">
                <Phone aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-700" />
                <span className="flex flex-col">
                  <a
                    href={`tel:${contact.phoneE164}`}
                    className="font-semibold text-navy-900 tabular-nums hover:text-brand-700"
                  >
                    {contact.phoneDisplay}
                  </a>
                  <span className="text-[13.5px]">{t("phoneAndWhatsApp")}</span>
                </span>
              </li>
              <li className="flex gap-3">
                <Mail aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-700" />
                <a
                  href={`mailto:${contact.email}`}
                  className="font-semibold break-all text-navy-900 hover:text-brand-700"
                >
                  {contact.email}
                </a>
              </li>
              <li className="flex gap-3">
                <Clock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-700" />
                <span className="flex flex-col items-start gap-2">
                  {contact.officeHoursText}
                  <OfficeStatusChip
                    hours={contact.officeHours}
                    pendingLabel={tl("checkingHours")}
                  />
                </span>
              </li>
            </ul>
            {contact.mapUrl ? (
              <a
                href={contact.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 w-max items-center gap-2 rounded-full bg-white px-5 text-[15px] font-semibold text-navy-900 shadow-[inset_0_0_0_1px_var(--color-mist-300)] transition-colors duration-150 hover:bg-mist-25 focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                <Route aria-hidden="true" className="size-[18px]" />
                {t("getDirections")}
              </a>
            ) : null}
          </address>
        </div>

        <div className="grid grid-cols-1 gap-8 border-t border-mist-200 pt-8 lg:grid-cols-2 lg:items-end">
          {livePayments.length > 0 ? (
            <div className="flex flex-col gap-3">
              <FooterHeading>{t("weAccept")}</FooterHeading>
              <ul className="flex flex-wrap gap-2">
                {livePayments.map((method) => (
                  <li
                    key={method.id}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-mist-200 bg-white px-3.5 text-[13.5px] font-semibold text-navy-900 [&_svg]:size-4 [&_svg]:text-brand-700"
                  >
                    {PAYMENT_ICONS[method.id]}
                    {method.note ? `${method.label} (${method.note})` : method.label}
                  </li>
                ))}
              </ul>
              {footer.paymentNote ? (
                <p className="text-[13.5px] text-mist-600">{footer.paymentNote}</p>
              ) : null}
            </div>
          ) : null}
          <div className="flex flex-col gap-3">
            <FooterHeading>{footer.newsletterTitle}</FooterHeading>
            <NewsletterForm
              placeholder={footer.newsletterPlaceholder}
              button={footer.newsletterButton}
              labels={{
                email: t("emailLabel"),
                invalid: t("invalidEmail"),
                subscribed: t("subscribed"),
              }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 border-t border-mist-200 pt-6 text-center lg:flex-row lg:justify-between lg:text-left">
          <div className="flex flex-col items-center gap-x-6 gap-y-2 lg:flex-row">
            <p className="text-[13.5px] text-mist-600">
              © {year} {footer.copyrightHolder}
            </p>
            <ul className="flex gap-1">
              {(legal?.items ?? [])
                .filter((item) => item.visible && item.href)
                .map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href ?? "/"}
                      className="inline-flex min-h-9 items-center px-2 text-[13.5px] text-mist-700 hover:text-navy-900 focus-visible:ring-3 focus-visible:ring-ring/40"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
          <DeveloperCredit label={t("developedBy")} />
        </div>
      </div>
    </footer>
  );
}

export { SiteFooter };
