"use client";

import type { Image } from "@waafa/shared";
import { SmartImage } from "@/components/media/SmartImage";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

type PhotoLightboxProps = {
  images: Image[];
  title: string;
  start: number;
  labels: { gallery: string; previous: string; next: string };
  onClose: () => void;
};

/** Photo lightbox (PackageDetail-photos, ShopProduct zoom): swipe on phones, arrow keys and buttons on desktop. */
function PhotoLightbox({ images, title, start, labels, onClose }: PhotoLightboxProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[min(1100px,calc(100vw-24px))] border-0 bg-midnight-950 p-3 sm:p-5">
        <DialogTitle className="sr-only">{`${labels.gallery}: ${title}`}</DialogTitle>
        <DialogDescription className="sr-only">{title}</DialogDescription>
        <Carousel opts={{ startIndex: start, loop: true }} className="w-full">
          <CarouselContent>
            {images.map((image) => (
              <CarouselItem key={image.src}>
                <figure className="flex flex-col gap-2">
                  <div className="relative aspect-[3/2] overflow-hidden rounded-xl">
                    <SmartImage
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="(min-width: 1100px) 1060px, 96vw"
                      className="object-contain"
                    />
                  </div>
                  <figcaption className="text-[13px] text-white/75">
                    {image.alt}
                    {image.credit ? <span className="text-white/50"> · {image.credit}</span> : null}
                  </figcaption>
                </figure>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious
            aria-label={labels.previous}
            className="left-2 bg-white/90 sm:-left-3"
          />
          <CarouselNext aria-label={labels.next} className="right-2 bg-white/90 sm:-right-3" />
        </Carousel>
      </DialogContent>
    </Dialog>
  );
}

export { PhotoLightbox };
