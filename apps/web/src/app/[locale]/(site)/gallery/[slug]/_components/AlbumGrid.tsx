"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Play } from "lucide-react";
import type { GalleryItem, Image } from "@waafa/shared";
import { SmartImage } from "@/components/media/SmartImage";

const PhotoLightbox = dynamic(
  () => import("@/components/media/PhotoLightbox").then((module) => module.PhotoLightbox),
  { ssr: false },
);

type AlbumGridProps = {
  title: string;
  items: GalleryItem[];
  labels: {
    /** "{index}" and "{total}" are replaced. */
    openPhoto: string;
    video: string;
    /** "{provider}" is replaced. */
    videoOn: string;
    providers: { youtube: string; facebook: string };
    lightbox: { gallery: string; previous: string; next: string };
  };
};

/**
 * Album masonry (Gallery-album, Gallery-photo): photos open the shared lightbox (loaded on first open); videos show the
 * poster and open on YouTube or Facebook in a new tab (embeds are on the cut list, PRD §17).
 */
function AlbumGrid({ title, items, labels }: AlbumGridProps) {
  const [open, setOpen] = useState<number | null>(null);
  const photoItems = items.filter((item) => item.kind === "photo");
  const photos: Image[] = photoItems.map((item) => item.image);
  const photoIndex = new Map(photoItems.map((item, index) => [item.id, index]));

  return (
    <>
      <ul className="columns-1 gap-3 sm:columns-2 lg:columns-3 [&>li]:mb-3">
        {items.map((item) => {
          if (item.kind === "video") {
            const provider = labels.providers[item.provider];
            return (
              <li key={item.id} className="break-inside-avoid">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block overflow-hidden rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  <SmartImage
                    src={item.poster.src}
                    alt={item.poster.alt}
                    ratio="16/9"
                    sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                  />
                  <span className="absolute inset-0 grid place-items-center bg-navy-900/30">
                    <span className="grid size-14 place-items-center rounded-full bg-white/90 text-navy-900 shadow-lg">
                      <Play aria-hidden="true" className="ml-0.5 size-6" />
                    </span>
                  </span>
                  <span className="sr-only">
                    {labels.video}, {labels.videoOn.replace("{provider}", provider)}
                  </span>
                </a>
                {item.caption ? (
                  <p className="mt-1.5 text-[13px] text-mist-600">{item.caption}</p>
                ) : null}
              </li>
            );
          }
          const index = photoIndex.get(item.id) ?? 0;
          const { width, height } = item.image;
          return (
            <li key={item.id} className="break-inside-avoid">
              <button
                type="button"
                onClick={() => setOpen(index)}
                aria-label={labels.openPhoto
                  .replace("{index}", String(index + 1))
                  .replace("{total}", String(photos.length))}
                className="group block w-full overflow-hidden rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                <SmartImage
                  src={item.image.src}
                  alt={item.image.alt}
                  ratio={width && height ? `${width}/${height}` : "4/3"}
                  sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                  zoomOnHover
                />
              </button>
              {item.caption ? (
                <p className="mt-1.5 text-[13px] text-mist-600">{item.caption}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
      {open !== null ? (
        <PhotoLightbox
          images={photos}
          title={title}
          start={open}
          labels={labels.lightbox}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </>
  );
}

export { AlbumGrid };
