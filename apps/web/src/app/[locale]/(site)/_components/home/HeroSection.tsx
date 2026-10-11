import type { CSSProperties, ReactNode } from "react";
import { MapPin, Phone } from "lucide-react";
import type { HomeContent, MediaSlot, OpeningHours } from "@waafa/shared";
import { GoldTriangle } from "@/components/brand/GoldTriangle";
import { OfficeStatusChip } from "@/components/layout/OfficeStatusChip";
import { SmartImage } from "@/components/media/SmartImage";
import { SmartVideo } from "@/components/media/SmartVideo";
import { FlightPath } from "@/components/motion/FlightPath";
import { TextRotate } from "@/components/motion/TextRotate";

type HeroSectionProps = {
  hero: HomeContent["hero"];
  media: MediaSlot | null;
  /** The travel brand from Settings › General, set as the eyebrow over the headline (Home board). */
  eyebrow: string;
  /** Office hours and the phone from Settings › Contact: the live Open now chip and a call link. */
  contact: { hours: OpeningHours; phoneDisplay: string; phoneE164: string; pendingLabel: string };
  /** The search card, overlapping the lower edge of the media panel. */
  search: ReactNode;
};

const MEDIA_SIZES = "(min-width: 1320px) 1240px, calc(100vw - 32px)";

/** Splits a headline line into words for the CSS word reveal (`--i` staggers them). */
function renderWords(text: string, offset = 0) {
  return text.split(" ").map((word, index) => (
    <span
      key={`${word}-${index}`}
      className="word-reveal"
      style={{ "--i": offset + index } as CSSProperties}
    >
      {word}
      {" "}
    </span>
  ));
}

/**
 * Home hero (Home, Home-m boards; DESIGN.md "Home hero"): headline on white with a word-by-word CSS reveal, an inset
 * rounded media panel whose poster is the LCP image, a rotating destination chip, and the search card overlapping
 * the panel's lower edge.
 */
function HeroSection({ hero, media, eyebrow, contact, search }: HeroSectionProps) {
  const firstLine = hero.title.split(" ").length;
  // "Mixkit · Mixkit" (no named author) reads as "Mixkit".
  const rawCredit = media?.video?.credit ?? media?.image?.credit;
  const credit = rawCredit ? [...new Set(rawCredit.split(" · "))].join(" · ") : undefined;

  return (
    <section aria-labelledby="home-hero-title" className="relative site-container pt-6 md:pt-10">
      <FlightPath />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
        <div>
          <p className="mb-3 flex items-center gap-2 text-[12.5px] font-bold tracking-[0.16em] text-brand-700 uppercase">
            <GoldTriangle />
            {eyebrow}
          </p>
          <h1 id="home-hero-title" className="max-w-[17ch] type-display text-navy-900">
            {renderWords(hero.title)}
            <span className="block text-electric-600">
              {renderWords(hero.titleAccent, firstLine)}
            </span>
          </h1>
        </div>
        <div className="flex flex-col gap-3 lg:pb-2">
          <p className="max-w-[54ch] type-lead text-mist-600">{hero.lead}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <OfficeStatusChip hours={contact.hours} pendingLabel={contact.pendingLabel} />
            <a
              href={`tel:${contact.phoneE164}`}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-1 text-[14.5px] font-semibold text-navy-900 tabular-nums outline-none hover:text-brand-700 focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <Phone aria-hidden="true" className="size-4 text-electric-600" />
              {contact.phoneDisplay}
            </a>
          </div>
        </div>
      </div>

      <div className="relative mt-6 md:mt-8">
        <div className="relative overflow-hidden rounded-[28px] bg-mist-100">
          {media?.video ? (
            <SmartVideo
              sources={media.video}
              poster={media.video.poster.src}
              alt={media.video.poster.alt}
              sizes={MEDIA_SIZES}
              preloadPoster
              className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/8]"
            />
          ) : media?.image ? (
            <SmartImage
              src={media.image.src}
              alt={media.image.alt}
              ratio="16/9"
              sizes={MEDIA_SIZES}
              preload
              frameClassName="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/8]"
            />
          ) : (
            <div className="aspect-[4/3] bg-(image:--ribbon) sm:aspect-[16/9] lg:aspect-[21/8]" />
          )}
          <p className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[13.5px] font-semibold text-navy-900 shadow-sm md:top-6 md:left-6">
            <MapPin aria-hidden="true" className="size-4 text-electric-600" />
            <span className="text-mist-600">{hero.rotatingLabel}</span>
            <TextRotate words={hero.rotating} />
          </p>
          {credit ? (
            <p className="absolute top-4 right-4 hidden rounded-full bg-midnight-950/55 px-2 py-0.5 text-[11px] text-white/90 sm:block md:top-6 md:right-6">
              {credit}
            </p>
          ) : null}
        </div>
        <div className="relative z-10 -mt-20 sm:-mx-0 sm:-mt-24 lg:mx-8 lg:-mt-28">{search}</div>
      </div>
    </section>
  );
}

export { HeroSection };
