import type { CSSProperties, ReactNode } from "react";
import { MapPin, Phone } from "lucide-react";
import type { Destination, HomeContent, MediaSlot, OpeningHours } from "@waafa/shared";
import { cn } from "cn";
import { GoldTriangle } from "@/components/brand/GoldTriangle";
import { RibbonLine } from "@/components/brand/RibbonLine";
import { OfficeStatusChip } from "@/components/layout/OfficeStatusChip";
import { CountryFlag } from "@/components/media/CountryFlag";
import { SmartImage } from "@/components/media/SmartImage";
import { SmartVideo } from "@/components/media/SmartVideo";
import { FlightPath } from "@/components/motion/FlightPath";
import { TextRotate } from "@/components/motion/TextRotate";
import { listDestinations } from "@/lib/data/content";
import { getAirport, searchAirports } from "@/lib/data/travel";

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

/**
 * The media panel: 4:3 on phones (the search stays within one thumb), 16:10 on tablets, and a cinematic fixed height
 * from 1024 px that grows with the window (issue 148). The height is known before the poster loads, so nothing shifts.
 */
const FRAME = "aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:h-[clamp(480px,58vh,620px)]";

/**
 * The country of a rotating place name ("Kathmandu" → NP): the Home destination with that name and its airport, else
 * an airport in a city of that name. Null when nothing matches, so the chip shows the word alone.
 */
async function countryOf(place: string, destinations: Destination[]): Promise<string | null> {
  const name = place.trim().toLowerCase();
  const destination = destinations.find((item) => item.name.trim().toLowerCase() === name);
  if (destination) return (await getAirport(destination.iata))?.countryCode ?? null;
  const [airport] = await searchAirports(place, 1);
  return airport && airport.city.trim().toLowerCase() === name ? airport.countryCode : null;
}

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
 * Home hero (Home, Home-m boards; DESIGN.md "Home hero"): the brand eyebrow and the headline (one h1) on white with a
 * word-by-word CSS reveal and a ribbon
 * line, an inset rounded media panel whose poster is the LCP image, a rotating destination chip with each country's
 * flag, and the search card overlapping the lower edge.
 */
async function HeroSection({ hero, media, eyebrow, contact, search }: HeroSectionProps) {
  // Destinations and airports from Admin give the rotating chip its flags.
  const destinations = await listDestinations();
  const flags = await Promise.all(hero.rotating.map((place) => countryOf(place, destinations)));
  const firstLine = hero.title.split(" ").length;
  // "Mixkit · Mixkit" (no named author) reads as "Mixkit".
  const rawCredit = media?.video?.credit ?? media?.image?.credit;
  const credit = rawCredit ? [...new Set(rawCredit.split(" · "))].join(" · ") : undefined;

  return (
    <section
      aria-labelledby="home-hero-title"
      className="relative isolate site-container pt-6 md:pt-10"
    >
      {/* Soft daylight behind the headline: two static radial glows in the brand blues, no blur filter. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-[560px] bg-[radial-gradient(52%_60%_at_82%_12%,var(--color-electric-100),transparent_72%),radial-gradient(40%_50%_at_14%_4%,var(--color-electric-50),transparent_70%)] [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
        <div>
          {/* The brand eyebrow is part of the h1, so the page's main heading names the company (issue 173). */}
          <h1 id="home-hero-title" className="max-w-[17ch] type-display text-navy-900">
            <span className="mb-3 flex items-center gap-2 font-sans text-[12.5px] leading-normal font-bold tracking-[0.16em] text-brand-700 uppercase">
              <GoldTriangle />
              {eyebrow}
            </span>
            {renderWords(hero.title)}
            <span className="block text-electric-600">
              {renderWords(hero.titleAccent, firstLine)}
            </span>
          </h1>
          <RibbonLine className="mt-4 w-20 md:mt-5 md:w-28" />
        </div>
        <div className="flex flex-col gap-3 lg:pb-2">
          <p className="max-w-[54ch] type-lead text-mist-600">{hero.lead}</p>
          {/* Phones stack the chip and the phone number, so the live status (computed after hydration, longer when
              closed) never wraps the row and shifts the hero (issue 91, CLS). */}
          <div className="flex flex-col items-start gap-y-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
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
        <div className="relative overflow-hidden rounded-[28px] bg-mist-100 lg:rounded-[32px]">
          {media?.video ? (
            <SmartVideo
              sources={media.video}
              poster={media.video.poster.src}
              alt={media.video.poster.alt}
              sizes={MEDIA_SIZES}
              preloadPoster
              className={FRAME}
            />
          ) : media?.image ? (
            <SmartImage
              src={media.image.src}
              alt={media.image.alt}
              ratio="16/9"
              sizes={MEDIA_SIZES}
              preload
              frameClassName={FRAME}
            />
          ) : (
            <div className={cn(FRAME, "bg-(image:--ribbon)")} />
          )}
          {/* Soft shade at both edges: the chips read on any sky, and the search card sits on a grounded edge. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-linear-to-b from-midnight-950/25 via-transparent via-35% to-midnight-950/45"
          />
          <FlightPath />
          <p className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[13.5px] font-semibold text-navy-900 shadow-sm md:top-6 md:left-6">
            <MapPin aria-hidden="true" className="size-4 text-electric-600" />
            <span className="text-mist-600">{hero.rotatingLabel}</span>
            <TextRotate
              words={hero.rotating}
              marks={flags.map((code, index) =>
                code ? <CountryFlag key={hero.rotating[index]} code={code} size="xs" /> : null,
              )}
            />
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
