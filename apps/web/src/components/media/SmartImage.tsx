import Image, { type ImageProps } from "next/image";
import { objectPositionOf, type FocalPoint } from "@waafa/shared/helpers/media";
import { cn } from "cn";
import { PHOTO_QUALITY } from "@/lib/media/imageQuality";

type SmartImageProps = Omit<ImageProps, "alt" | "placeholder"> & {
  /** Required. Describe the photo; pass "" only for purely decorative images. */
  alt: string;
  /**
   * Reserve space with an aspect-ratio frame (e.g. "4/3", "3/4", "16/9") and fill it with the photo.
   * Without a ratio the image keeps its own width and height.
   */
  ratio?: string;
  /** Desktop hover zoom inside a `group` card (1.045 over 700 ms, MOTION.md). */
  zoomOnHover?: boolean;
  /** Classes for the frame (only with `ratio`). */
  frameClassName?: string;
  /** The part staff keep in view wherever the photo is cropped to fit (admin focal point, D0 R3). */
  focal?: FocalPoint | undefined;
};

/**
 * next/image with WAAFA defaults: AVIF/WebP at photo quality 65 (issue 185), a blurred placeholder for imported photos, a mist frame that
 * reserves the space (no layout shift), and lazy loading unless `preload` is set for the LCP image. A preloaded
 * image is also fetched at high priority (issue 170): the preload hint alone left the store banner queued as Low.
 */
function SmartImage({
  alt,
  ratio,
  zoomOnHover = false,
  frameClassName,
  className,
  sizes,
  src,
  preload,
  fetchPriority,
  quality = PHOTO_QUALITY,
  focal,
  style,
  ...props
}: SmartImageProps) {
  const priority = {
    ...(preload ? { preload } : {}),
    ...(fetchPriority || preload ? { fetchPriority: fetchPriority ?? "high" } : {}),
  };
  // A dynamic value from the data layer, so it is the one inline style here.
  const position = objectPositionOf(focal);
  const placed = position ? { ...style, objectPosition: position } : style;
  const hasBlur = typeof src === "object" && "blurDataURL" in src && Boolean(src.blurDataURL);
  const zoom =
    zoomOnHover &&
    "transition-transform duration-700 ease-out pointer-fine:group-hover:scale-[1.045] motion-reduce:transition-none";

  if (!ratio) {
    return (
      <Image
        src={src}
        alt={alt}
        sizes={sizes}
        quality={quality}
        placeholder={hasBlur ? "blur" : "empty"}
        style={placed}
        className={cn(zoom, className)}
        {...priority}
        {...props}
      />
    );
  }

  return (
    <div
      className={cn("relative w-full overflow-hidden bg-mist-100", frameClassName)}
      style={{ aspectRatio: ratio }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? "100vw"}
        quality={quality}
        placeholder={hasBlur ? "blur" : "empty"}
        style={placed}
        className={cn("object-cover", zoom, className)}
        {...priority}
        {...props}
      />
    </div>
  );
}

export { SmartImage };
