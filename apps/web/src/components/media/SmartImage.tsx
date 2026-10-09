import Image, { type ImageProps } from "next/image";
import { cn } from "cn";

type SmartImageProps = Omit<ImageProps, "alt" | "fill" | "placeholder"> & {
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
};

/**
 * next/image with WAAFA defaults: AVIF/WebP, a blurred placeholder for imported photos, a mist frame that
 * reserves the space (no layout shift), and lazy loading unless `preload` is set for the LCP image.
 */
function SmartImage({
  alt,
  ratio,
  zoomOnHover = false,
  frameClassName,
  className,
  sizes,
  src,
  ...props
}: SmartImageProps) {
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
        placeholder={hasBlur ? "blur" : "empty"}
        className={cn(zoom, className)}
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
        placeholder={hasBlur ? "blur" : "empty"}
        className={cn("object-cover", zoom, className)}
        {...props}
      />
    </div>
  );
}

export { SmartImage };
