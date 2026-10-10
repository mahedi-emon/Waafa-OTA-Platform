import { Check, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { whatsappLink } from "@waafa/shared";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { OfficeStatusChip } from "@/components/layout/OfficeStatusChip";
import { listTrustItems } from "@/lib/data/content";
import { getContactSettings } from "@/lib/data/settings";

type HelpCardProps = { pageName: string };

/** Sticky help card on results pages: call or WhatsApp a person, live office status, and why ask WAAFA. */
async function HelpCard({ pageName }: HelpCardProps) {
  const [contact, trust, t, tLayout] = await Promise.all([
    getContactSettings(),
    listTrustItems(),
    getTranslations("Flights.help"),
    getTranslations("Layout"),
  ]);

  return (
    <aside aria-labelledby="results-help-title" className="flex flex-col gap-4 lg:sticky lg:top-24">
      <div className="flex flex-col gap-3 rounded-2xl bg-navy-900 p-5 text-white">
        <h2 id="results-help-title" className="font-display text-[17px] font-bold">
          {t("title")}
        </h2>
        <p className="text-[14px] text-white/80">{t("body")}</p>
        <OfficeStatusChip
          hours={contact.officeHours}
          pendingLabel={tLayout("checkingHours")}
          className="self-start"
        />
        <p className="text-[13px] text-white/70">{contact.officeHoursText}</p>
        <a
          href={`tel:${contact.phoneE164}`}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-[15px] font-semibold text-navy-900 outline-none hover:bg-mist-100 focus-visible:ring-3 focus-visible:ring-cyan-400/60"
        >
          <Phone aria-hidden="true" className="size-4" />
          <span className="tabular-nums">{contact.phoneDisplay}</span>
        </a>
        <a
          href={whatsappLink(
            contact.whatsappE164,
            contact.whatsappMessage.replace("{page}", pageName),
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-whatsapp-700 px-5 text-[15px] font-semibold text-white outline-none hover:bg-whatsapp-500 focus-visible:ring-3 focus-visible:ring-cyan-400/60"
        >
          <WhatsAppIcon className="size-5" />
          {t("whatsapp")}
        </a>
      </div>
      {trust.length > 0 ? (
        <div className="rounded-2xl border border-mist-200 bg-white p-5">
          <h2 className="mb-3 text-[14px] font-semibold text-navy-900">{t("why")}</h2>
          <ul className="flex flex-col gap-2.5">
            {trust.map((item) => (
              <li key={item.id} className="flex gap-2 text-[14px] leading-snug text-ink-900">
                <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success-600" />
                {item.detail}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}

export { HelpCard };
