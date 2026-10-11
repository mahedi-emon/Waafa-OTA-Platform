import type { ReactNode } from "react";
import type { MediaSlot } from "@waafa/shared";
import { cn } from "cn";
import { SmartImage } from "@/components/media/SmartImage";

type BannerHeroProps = {
  /** id of the h1, so the section is named by it. */
  id: string;
  kicker: string;
  title: string;
  lead?: string;
  /** The page's admin-managed header photo (a video slot shows its poster); without one, the ribbon gradient. */
  media?: MediaSlot | null;
  /** A record's own photo (a flight route, a country), used instead of a media slot. */
  photo?: MediaSlot["image"];
  /** Right column on desktop, under the lead on phones: usually the page's search form. */
  aside?: ReactNode;
  /** A row under the heading and the aside (popular links, chips). */
  footer?: ReactNode;
  className?: string;
};

/**
 * Listing page banner (Packages, Visa, Group fares, Visa guide boards): an inset rounded panel with the page photo
 * under a navy gradient, a cyan kicker, the white h1 and lead, and the search on the right. The photo is the LCP
 * element, so it renders still and only starts its slow Ken Burns drift (desktop, motion allowed) after 1.2 s.
 */
function BannerHero({
  id,
  kicker,
  title,
  lead,
  media,
  photo,
  aside,
  footer,
  className,
}: BannerHeroProps) {
  const image = photo ?? media?.image ?? media?.video?.poster;
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "relative isolate overflow-hidden rounded-[28px] bg-midnight-950 text-white",
        className,
      )}
    >
      {image ? (
        <div aria-hidden="true" className="absolute inset-0 -z-20 overflow-hidden">
          <SmartImage
            src={image.src}
            alt=""
            fill
            preload
            sizes="(min-width: 1320px) 1288px, 100vw"
            className="ken-burns object-cover"
          />
        </div>
      ) : (
        <div aria-hidden="true" className="absolute inset-0 -z-20 bg-(image:--ribbon)" />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-r from-midnight-950/95 via-navy-900/80 to-navy-900/40"
      />
      <div className="grid grid-cols-1 gap-6 p-6 md:p-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-end lg:gap-10 lg:py-12">
        <div className="flex max-w-[60ch] flex-col gap-3">
          <p className="flex items-center gap-2 text-[13px] font-bold tracking-[0.14em] text-cyan-400 uppercase">
            <span aria-hidden="true" className="h-px w-6 bg-cyan-400" />
            {kicker}
          </p>
          <h1
            id={id}
            className="font-display text-[32px] leading-[1.06] font-extrabold tracking-tight text-balance md:text-[46px]"
          >
            {title}
          </h1>
          {lead ? (
            <p className="text-[16px] leading-relaxed text-white/80 md:text-[17px]">{lead}</p>
          ) : null}
        </div>
        {aside ? <div className="min-w-0">{aside}</div> : null}
        {footer ? <div className="min-w-0 lg:col-span-2">{footer}</div> : null}
      </div>
    </section>
  );
}

export { BannerHero };
