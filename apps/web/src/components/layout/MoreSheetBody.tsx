import { Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ContactSettings, MenuItem } from "@waafa/shared";
import { whatsappLink } from "@waafa/shared/helpers/phone";
import { AccountLink } from "@/components/account/AccountLink";
import { User } from "@/components/icons/server/User";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { getSiteSettings } from "@/lib/data/settings";
import { MoreGrid } from "./MoreGrid";

type MoreSheetBodyProps = {
  items: MenuItem[];
  contact: ContactSettings;
};

/**
 * Phone More sheet (Home-m-more board): the More menu plus Gallery, Feedback and Track, then Call us and WhatsApp, and
 * Log in or My account when accounts are live (issue 241).
 */
async function MoreSheetBody({ items, contact }: MoreSheetBodyProps) {
  const [t, site] = await Promise.all([getTranslations("Layout"), getSiteSettings()]);

  return (
    <div className="flex flex-col gap-5">
      <MoreGrid items={items} />
      {site.accountsLive ? (
        <AccountLink
          labels={{ logIn: t("logIn"), myAccount: t("myAccount") }}
          icon={<User aria-hidden="true" className="size-[18px]" />}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-navy-900 text-[15px] font-semibold text-white outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        />
      ) : null}
      <div className="grid grid-cols-2 gap-2">
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
    </div>
  );
}

export { MoreSheetBody };
