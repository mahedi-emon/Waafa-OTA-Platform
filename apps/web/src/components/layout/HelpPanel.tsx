import { Headset, Mail, MapPin, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { whatsappLink, type ContactSettings } from "@waafa/shared";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { ContactRow } from "./ContactRow";
import { OfficeStatusChip } from "./OfficeStatusChip";

type HelpPanelProps = {
  contact: ContactSettings;
};

/** "+8801823232241" → "+880 1823-232241" for the WhatsApp row (the national format is the phone row). */
function formatInternational(e164: string): string {
  const national = e164.replace(/^\+880/, "");
  return national.length === 10 ? `+880 ${national.slice(0, 4)}-${national.slice(4)}` : e164;
}

/**
 * "Need help?" panel (Home-help and Home-m-help boards): who you will talk to, the live office status and the four
 * ways to reach the office. Rendered on the server; the popover (desktop) and bottom sheet (phones) show it.
 */
async function HelpPanel({ contact }: HelpPanelProps) {
  const t = await getTranslations("Layout");
  const whatsapp = formatInternational(contact.whatsappE164);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-2xl bg-(image:--ribbon-soft) p-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-navy-900 text-white">
          <Headset aria-hidden="true" className="size-5" />
        </span>
        <span className="flex flex-col">
          <span className="font-display text-[18px] leading-tight font-bold text-navy-900">
            {t("needHelp")}
          </span>
          <span className="text-[13.5px] text-mist-600">{contact.helpLine}</span>
        </span>
      </div>

      <div className="flex flex-col gap-1.5 px-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-semibold tracking-[0.08em] text-mist-600 uppercase">
            {t("officeHours")}
          </span>
          <OfficeStatusChip hours={contact.officeHours} pendingLabel={t("checkingHours")} />
        </div>
        <p className="text-[13.5px] leading-relaxed text-mist-600">
          {contact.officeHoursText}. {contact.closedText}.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <ContactRow
          icon={<Phone aria-hidden="true" />}
          label={t("call")}
          value={contact.phoneDisplay}
          href={`tel:${contact.phoneE164}`}
          linkLabel={`${t("call")} ${contact.phoneDisplay}`}
          copy={{
            value: contact.phoneDisplay,
            label: t("copyPhone"),
            copiedLabel: t("phoneCopied"),
            failedLabel: t("copyFailed"),
          }}
        />
        <ContactRow
          icon={<WhatsAppIcon className="text-whatsapp-700" />}
          label={t("whatsapp")}
          value={whatsapp}
          href={whatsappLink(contact.whatsappE164)}
          external
          linkLabel={`${t("whatsapp")} ${whatsapp}`}
        />
        <ContactRow
          icon={<Mail aria-hidden="true" />}
          label={t("email")}
          value={contact.email}
          href={`mailto:${contact.email}`}
          linkLabel={`${t("email")} ${contact.email}`}
          copy={{
            value: contact.email,
            label: t("copyEmail"),
            copiedLabel: t("emailCopied"),
            failedLabel: t("copyFailed"),
          }}
        />
        {contact.mapUrl ? (
          <ContactRow
            icon={<MapPin aria-hidden="true" />}
            label={t("visit")}
            value={contact.visitLabel}
            href={contact.mapUrl}
            external
            linkLabel={`${t("visit")} ${contact.visitLabel}`}
          />
        ) : null}
      </div>
    </div>
  );
}

export { HelpPanel };
