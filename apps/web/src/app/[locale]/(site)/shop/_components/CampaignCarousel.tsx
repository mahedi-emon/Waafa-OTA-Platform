"use client";

import { ArrowRight } from "lucide-react";
import type { Banner } from "@waafa/shared";
import { SmartImage } from "@/components/media/SmartImage";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Link } from "@/i18n/navigation";

type CampaignCarouselProps = {
  banners: Array<
    Pick<Banner, "id" | "kicker" | "title" | "body" | "image" | "link" | "validityText" | "sample">
  >;
  labels: { region: string; previous: string; next: string; sample: string };
};

/**
 * Store campaigns (Shop hero): swipe on phones, arrows on desktop; the first photo is the LCP image and loads
 * first. Admin banners with the shop-hero placement, in admin order.
 */
function CampaignCarousel({ banners, labels }: CampaignCarouselProps) {
  return (
    <Carousel
      opts={{ loop: banners.length > 1 }}
      aria-label={labels.region}
      className="overflow-hidden rounded-[24px]"
    >
      <CarouselContent className="-ml-0">
        {banners.map((banner, index) => (
          <CarouselItem key={banner.id} className="pl-0">
            <article className="relative grid min-h-[300px] overflow-hidden bg-navy-900 md:min-h-[360px]">
              <SmartImage
                src={banner.image.src}
                alt={banner.image.alt}
                fill
                preload={index === 0}
                sizes="(min-width: 1024px) 66vw, 100vw"
                className="object-cover opacity-70"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-r from-navy-900/95 via-navy-900/70 to-navy-900/10"
              />
              <div className="relative flex max-w-xl flex-col justify-end gap-3 p-6 text-white md:justify-center md:p-10">
                <div className="flex flex-wrap items-center gap-2">
                  {banner.kicker ? (
                    <p className="text-[12.5px] font-bold tracking-[0.12em] text-cyan-400 uppercase">
                      {banner.kicker}
                    </p>
                  ) : null}
                  {banner.sample ? (
                    <span className="rounded-md border border-dashed border-white/40 px-1.5 text-[11px] font-semibold text-white/80">
                      {labels.sample}
                    </span>
                  ) : null}
                </div>
                <h2 className="font-display text-[28px] leading-[1.1] font-extrabold text-balance md:text-[38px]">
                  {banner.title}
                </h2>
                {banner.body ? (
                  <p className="text-[15px] leading-relaxed text-white/85">{banner.body}</p>
                ) : null}
                <Link
                  href={banner.link.href}
                  className="mt-1 inline-flex h-12 items-center gap-2 self-start rounded-full bg-white px-5 text-[15px] font-semibold text-navy-900 outline-none hover:bg-mist-100 focus-visible:ring-3 focus-visible:ring-cyan-400/60"
                >
                  {banner.link.label}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
                {banner.validityText ? (
                  <p className="text-[13px] text-white/70">{banner.validityText}</p>
                ) : null}
              </div>
            </article>
          </CarouselItem>
        ))}
      </CarouselContent>
      {banners.length > 1 ? (
        <>
          <CarouselPrevious
            aria-label={labels.previous}
            className="top-auto right-16 bottom-4 left-auto translate-y-0 bg-white/90"
          />
          <CarouselNext
            aria-label={labels.next}
            className="top-auto right-4 bottom-4 translate-y-0 bg-white/90"
          />
        </>
      ) : null}
    </Carousel>
  );
}

export { CampaignCarousel };
