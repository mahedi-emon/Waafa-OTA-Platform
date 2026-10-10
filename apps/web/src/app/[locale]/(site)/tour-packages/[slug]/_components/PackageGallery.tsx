"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Images } from "lucide-react";
import { cn } from "cn";
import type { Image } from "@waafa/shared";
import { SmartImage } from "@/components/media/SmartImage";

/** The lightbox (Dialog + Embla) loads on the first tap, keeping it out of the first load. */
const PackageLightbox = dynamic(() =>
  import("./PackageLightbox").then((module) => module.PackageLightbox),
);

/** Desktop grid per photo count: the first photo is always the large one on the left. */
const LAYOUTS: Record<number, string> = {
  1: "",
  2: "md:grid-cols-[2fr_1fr] md:grid-rows-2",
  3: "md:grid-cols-[2fr_1fr] md:grid-rows-2",
  4: "md:grid-cols-4 md:grid-rows-2",
  5: "md:grid-cols-4 md:grid-rows-2",
};

type PackageGalleryProps = {
  images: Image[];
  title: string;
  labels: { all: string; gallery: string; previous: string; next: string };
};

/**
 * Package gallery (PackageDetail, PackageDetail-photos): a bento of the first five photos; any photo opens the
 * lightbox at that photo (Embla: swipe on phones, arrow keys and buttons on desktop).
 */
function PackageGallery({ images, title, labels }: PackageGalleryProps) {
  const [start, setStart] = useState<number | null>(null);
  const shown = images.slice(0, 5);

  return (
    <>
      <div
        className={cn(
          "grid grid-cols-1 gap-2 overflow-hidden rounded-[20px] md:h-[440px]",
          LAYOUTS[shown.length],
        )}
      >
        {shown.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onClick={() => setStart(index)}
            className={cn(
              "group relative cursor-pointer overflow-hidden bg-mist-100 outline-none focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:ring-inset",
              index === 0 ? "aspect-[4/3] md:row-span-2 md:aspect-auto" : "hidden md:block",
              index === 0 && shown.length >= 4 && "md:col-span-2",
              shown.length === 4 && index === 3 && "md:col-span-2",
              shown.length === 2 && "md:row-span-2",
            )}
          >
            <SmartImage
              src={image.src}
              alt={image.alt}
              fill
              sizes={index === 0 ? "(min-width: 768px) 50vw, 100vw" : "25vw"}
              preload={index === 0}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>
      {images.length > 1 ? (
        <button
          type="button"
          onClick={() => setStart(0)}
          className="relative z-10 -mt-14 ml-3 inline-flex h-10 items-center gap-2 self-start rounded-full bg-white/95 px-4 text-[14px] font-semibold text-navy-900 shadow-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40 md:ml-4"
        >
          <Images aria-hidden="true" className="size-4" />
          {labels.all}
        </button>
      ) : null}
      {start !== null ? (
        <PackageLightbox
          images={images}
          title={title}
          start={start}
          labels={labels}
          onClose={() => setStart(null)}
        />
      ) : null}
    </>
  );
}

export { PackageGallery };
