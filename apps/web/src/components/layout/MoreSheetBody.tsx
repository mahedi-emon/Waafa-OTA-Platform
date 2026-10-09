import { Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { whatsappLink, type ContactSettings, type MenuItem } from "@waafa/shared";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { MoreGrid } from "./MoreGrid";

type MoreSheetBodyProps = {
  items: MenuItem[];
  contact: ContactSettings;
};

/** Phone More sheet (Home-m-more board): the More menu plus Gallery, Feedback and Track, then Call us and WhatsApp. */
async function MoreSheetBody({ items, contact }: MoreSheetBodyProps) {
  const t = await getTranslations("Layout");

  return (
    <div className="flex flex-col gap-5">
      <MoreGrid items={items} />
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
