import Image from "next/image";
import { Film } from "@/components/icons/serverIcons";
import { objectPositionOf, type FocalPoint, type MediaKind } from "@waafa/shared/helpers/media";
import { cn } from "cn";

type MediaThumbProps = {
  url: string;
  kind: MediaKind;
  /** Empty for a thumbnail next to its own words (the alt text is read out there). */
  alt: string;
  /** The width it is drawn at, for next/image ("160px", "(min-width: 768px) 25vw, 50vw"). */
  sizes: string;
  focal?: FocalPoint | undefined;
  className?: string;
};

/**
 * A library file drawn small: a photo through next/image (a 2560 px original is never sent to a grid), a video as its
 * first frame (only its metadata and first frame load). Fills its parent, which sets the shape.
 */
function MediaThumb({ url, kind, alt, sizes, focal, className }: MediaThumbProps) {
  if (kind === "video") {
    return (
      <span className={cn("relative block size-full bg-midnight-950", className)}>
        <video
          src={`${url}#t=0.5`}
          preload="metadata"
          muted
          playsInline
          aria-label={alt || undefined}
          aria-hidden={alt ? undefined : true}
          className="size-full object-cover"
        />
        <span
          aria-hidden="true"
          className="absolute bottom-1.5 left-1.5 flex size-7 items-center justify-center rounded-full bg-midnight-950/70 text-white"
        >
          <Film className="size-4" />
        </span>
      </span>
    );
  }
  const position = objectPositionOf(focal);
  return (
    <span className={cn("relative block size-full bg-mist-100", className)}>
      <Image
        src={url}
        alt={alt}
        fill
        sizes={sizes}
        unoptimized={/^https?:\/\//.test(url)}
        className="object-cover"
        style={position ? { objectPosition: position } : undefined}
      />
    </span>
  );
}

export { MediaThumb };
