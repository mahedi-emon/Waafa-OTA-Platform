import { ChevronRight, Mail, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { whatsappLink, type ContactSettings, type MenuItem } from "@waafa/shared";
import { MenuIcon } from "@/components/icons/MenuIcon";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Link } from "@/i18n/navigation";
import { MoreGrid } from "./MoreGrid";
import { OfficeStatusChip } from "./OfficeStatusChip";

type MobileMenuBodyProps = {
  links: MenuItem[];
  more: MenuItem[];
  contact: ContactSettings;
};

/** Drawer body (Home-m-drawer board): every main link, the More grid and the contact block. */
async function MobileMenuBody({ links, more, contact }: MobileMenuBodyProps) {
  const t = await getTranslations("Layout");

  return (
    <div className="flex flex-col gap-6 px-4 pt-2 pb-[calc(24px+env(safe-area-inset-bottom))]">
      <ul className="divide-y divide-mist-200">
        {links
          .filter((item) => item.visible && item.href)
          .map((item) => (
            <li key={item.id}>
              <Link
                href={item.href ?? "/"}
                className="flex h-14 items-center gap-3.5 rounded-xl text-[17px] font-semibold text-navy-900 outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                <MenuIcon name={item.icon} className="size-[22px] text-brand-700" />
                <span className="flex-1">{item.label}</span>
                <ChevronRight aria-hidden="true" className="size-5 text-mist-400" />
              </Link>
            </li>
          ))}
      </ul>

      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold tracking-[0.1em] text-mist-600 uppercase">
          {t("moreLabel")}
        </p>
        <MoreGrid items={more} />
      </div>

      <div className="flex flex-col gap-3 rounded-[20px] bg-mist-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-display text-[17px] font-bold text-navy-900">{t("needHelp")}</p>
          <OfficeStatusChip hours={contact.officeHours} pendingLabel={t("checkingHours")} />
        </div>
        <p className="text-[13.5px] leading-relaxed text-mist-600">
          {contact.addressLines.join(", ")}, {contact.city}. {contact.officeHoursText}.
        </p>
        <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
          <a
            href={`tel:${contact.phoneE164}`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold text-navy-900 shadow-[inset_0_0_0_1px_var(--color-mist-300)] outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <Phone aria-hidden="true" className="size-[18px]" />
            {t("callUs")}
          </a>
          <a
            href={whatsappLink(contact.whatsappE164)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-whatsapp-700 text-[15px] font-semibold text-white outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <WhatsAppIcon />
            {t("whatsapp")}
          </a>
        </div>
        <a
          href={`mailto:${contact.email}`}
          className="inline-flex h-11 items-center gap-2 self-start rounded-full px-1 text-[14.5px] font-semibold text-brand-700 outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <Mail aria-hidden="true" className="size-[18px]" />
          {contact.email}
        </a>
      </div>
    </div>
  );
}

export { MobileMenuBody };
