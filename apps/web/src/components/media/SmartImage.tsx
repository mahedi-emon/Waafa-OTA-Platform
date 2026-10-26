import { getImageProps, type ImageProps } from "next/image";
import { preload as preloadImage } from "react-dom";
import { objectPositionOf, type FocalPoint } from "@waafa/shared/helpers/media";
import { cn } from "cn";
import { PHOTO_QUALITY } from "@/lib/media/imageQuality";

type SmartImageProps = Omit<ImageProps, "alt" | "placeholder" | "onLoad" | "onError"> & {
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
 * Photos with WAAFA defaults: AVIF/WebP at photo quality 65 (issue 185), a blurred placeholder for imported photos, a
 * mist frame that reserves the space (no layout shift), and lazy loading unless `preload` is set for the LCP image. A
 * preloaded image is also fetched at high priority (issue 170).
 *
 * Issue 236: the attributes come from `getImageProps` (the same optimiser URLs, srcset and sizes as next/image) on a
 * plain <img>, so a photo needs no JavaScript in the browser; next/image hydrated one client component per photo (69
 * on the home page). The blurred placeholder stays behind the photo, which covers it once loaded.
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
  // A dynamic value from the data layer, so it is the one inline style here.
  const position = objectPositionOf(focal);
  const placed = position ? { ...style, objectPosition: position } : style;
  const hasBlur = typeof src === "object" && "blurDataURL" in src && Boolean(src.blurDataURL);
  const zoom =
    zoomOnHover &&
    "transition-transform duration-700 ease-out pointer-fine:group-hover:scale-[1.045] motion-reduce:transition-none";

  const { props: image } = getImageProps({
    src,
    alt,
    quality,
    placeholder: hasBlur ? "blur" : "empty",
    style: placed,
    ...(ratio ? { fill: true, sizes: sizes ?? "100vw" } : { sizes }),
    ...(preload ? { preload: true } : {}),
    ...(fetchPriority || preload ? { fetchPriority: fetchPriority ?? "high" } : {}),
    ...props,
  });
  if (preload && image.src) {
    preloadImage(image.src, {
      as: "image",
      fetchPriority: "high",
      ...(image.srcSet ? { imageSrcSet: image.srcSet } : {}),
      ...(image.sizes ? { imageSizes: image.sizes } : {}),
    });
  }

  // getImageProps is next/image's own attribute builder; a plain element keeps the photo free of client code.
  // eslint-disable-next-line @next/next/no-img-element
  const img = <img {...image} alt={alt} className={cn(ratio && "object-cover", zoom, className)} />;
  if (!ratio) return img;
  return (
    <div
      className={cn("relative w-full overflow-hidden bg-mist-100", frameClassName)}
      style={{ aspectRatio: ratio }}
    >
      {img}
    </div>
  );
}

export { SmartImage };
