import type { CSSProperties, ReactNode } from "react";
import { MapPin } from "lucide-react";
import type { HomeContent, MediaSlot } from "@waafa/shared";
import { SmartImage } from "@/components/media/SmartImage";
import { SmartVideo } from "@/components/media/SmartVideo";
import { TextRotate } from "@/components/motion/TextRotate";

type HeroSectionProps = {
  hero: HomeContent["hero"];
  media: MediaSlot | null;
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
function HeroSection({ hero, media, search }: HeroSectionProps) {
  const firstLine = hero.title.split(" ").length;
  // "Mixkit · Mixkit" (no named author) reads as "Mixkit".
  const rawCredit = media?.video?.credit ?? media?.image?.credit;
  const credit = rawCredit ? [...new Set(rawCredit.split(" · "))].join(" · ") : undefined;

  return (
    <section aria-labelledby="home-hero-title" className="site-container pt-6 md:pt-10">
      <h1 id="home-hero-title" className="max-w-[17ch] type-display text-navy-900">
        {renderWords(hero.title)}
        <span className="block text-electric-600">{renderWords(hero.titleAccent, firstLine)}</span>
      </h1>
      <p className="mt-4 max-w-[54ch] type-lead text-mist-600">{hero.lead}</p>

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
