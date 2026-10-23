import { Clock3, MapPin, Navigation, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { whatsappLink, type HomeContent } from "@waafa/shared";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { SmartImage } from "@/components/media/SmartImage";
import { getMediaSlot } from "@/lib/data/content";
import { getContactSettings } from "@/lib/data/settings";

type CtaSectionProps = { cta: HomeContent["cta"] };

/**
 * Closing band (FR-HOME 13): talk to a person on WhatsApp or by phone, and the office card with hours and
 * directions. Until Waafa's own office photo is uploaded, the ribbon with the city stands in (no placeholder text).
 */
async function CtaSection({ cta }: CtaSectionProps) {
  const [contact, office, t] = await Promise.all([
    getContactSettings(),
    getMediaSlot("office"),
    getTranslations("Home.cta"),
  ]);

  return (
    <section aria-labelledby="home-cta" className="py-11 md:py-16 xl:py-[88px]">
      <div className="site-container reveal-on-view">
        <div className="grid grid-cols-1 overflow-hidden rounded-[28px] bg-midnight-950 text-white lg:grid-cols-[1.15fr_1fr]">
          <div className="flex flex-col gap-4 p-6 md:p-10">
            <p className="type-label text-cyan-400">{t("kicker")}</p>
            <h2 id="home-cta" className="type-h2">
              {cta.title}
            </h2>
            <p className="max-w-[50ch] type-lead text-white/80">{cta.body}</p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappLink(
                  contact.whatsappE164,
                  contact.whatsappMessage.replace("{page}", t("pageName")),
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full bg-whatsapp-700 px-6 text-[15px] font-semibold text-white outline-none hover:bg-whatsapp-500 focus-visible:ring-3 focus-visible:ring-cyan-400/60"
              >
                {/* Shimmer (HANDOFF: shimmer button on WhatsApp): desktop, once every few seconds, off under reduced motion. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 hidden overflow-hidden rounded-[inherit] motion-reduce:hidden! pointer-fine:lg:block"
                >
                  <span className="absolute inset-y-0 left-0 w-1/3 animate-sheen bg-linear-to-r from-transparent via-white/30 to-transparent" />
                </span>
                <WhatsAppIcon className="relative size-5" />
                {t("whatsapp")}
              </a>
              <a
                href={`tel:${contact.phoneE164}`}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white/10 px-6 text-[15px] font-semibold text-white ring-1 ring-white/25 outline-none hover:bg-white/15 focus-visible:ring-3 focus-visible:ring-cyan-400/60"
              >
                <Phone aria-hidden="true" className="size-4" />
                {t("call", { phone: contact.phoneDisplay })}
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-4 bg-white/5 p-6 md:p-10">
            {office?.image ? (
              <SmartImage
                src={office.image.src}
                focal={office.image.focal}
                alt={office.image.alt}
                ratio="16/9"
                sizes="(min-width: 1024px) 40vw, 90vw"
                frameClassName="rounded-2xl"
              />
            ) : (
              // Until Waafa's own office photo is uploaded: the ribbon with the city, never a placeholder label.
              <div
                aria-hidden="true"
                className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-(image:--ribbon)"
              >
                <span className="absolute inset-0 bg-linear-to-t from-midnight-950/70 via-midnight-950/10 to-transparent" />
                <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-[13.5px] font-semibold text-navy-900 shadow-sm">
                  <MapPin className="size-4 text-electric-600" />
                  {contact.city}
                </span>
              </div>
            )}
            <address className="flex items-start gap-2.5 text-[14.5px] leading-relaxed text-white/90 not-italic">
              <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-cyan-400" />
              <span>
                {contact.addressLines.join(", ")}, {contact.city}
              </span>
            </address>
            <p className="flex items-start gap-2.5 text-[14.5px] text-white/90">
              <Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-cyan-400" />
              <span>
                {contact.officeHoursText}
                <span className="block text-white/70">{contact.closedText}</span>
              </span>
            </p>
            {contact.mapUrl ? (
              <a
                href={contact.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 self-start rounded-full px-1 text-[14.5px] font-semibold text-cyan-400 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-cyan-400/60"
              >
                <Navigation aria-hidden="true" className="size-4" />
                {t("directions")}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export { CtaSection };
