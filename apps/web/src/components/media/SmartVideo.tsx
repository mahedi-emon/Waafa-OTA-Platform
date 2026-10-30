"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image, { type StaticImageData } from "next/image";
import { objectPositionOf, type FocalPoint } from "@waafa/shared/helpers/media";
import { cn } from "cn";
import { PHOTO_QUALITY } from "@/lib/media/imageQuality";
import { usePrefersReducedMotion } from "@/components/motion/reducedMotion";
import { canAutoplayVideo, type ConnectionInfo } from "./videoPolicy";

type NetworkInformationLike = ConnectionInfo & EventTarget;

function readConnection(): NetworkInformationLike | undefined {
  return (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
}

/** Re-checks playback when the connection changes (e.g. Save-Data turned on, 4G drops to 3G). */
function subscribeToConnection(onChange: () => void): () => void {
  const connection = readConnection();
  connection?.addEventListener("change", onChange);
  return () => connection?.removeEventListener("change", onChange);
}

/** Phones (below the md breakpoint) get the 720 px files; the browser picks the first matching source. */
const PHONE_QUERY = "(max-width: 767px)";

/** The first sign of a visitor: any of these ends the page's LCP window, so the hero loop may start (issue 170). */
const ENGAGE_EVENTS = [
  "pointermove",
  "pointerdown",
  "keydown",
  "scroll",
  "wheel",
  "touchstart",
] as const;

type SmartVideoProps = {
  /**
   * MP4 (H.264) is required; WebM (VP9) is offered first when present. The `*Mobile` files (720 px wide)
   * are picked on screens up to 767 px, so phones download about half the bytes.
   */
  sources: { mp4: string; webm?: string; mp4Mobile?: string; webmMobile?: string };
  /** Poster frame, rendered with next/image so it is optimised and can be the LCP element. */
  poster: StaticImageData | string;
  /** Describes the poster for people who cannot see it; use "" only when the loop is purely decorative. */
  alt: string;
  /** next/image `sizes` for the poster, e.g. "(min-width: 1280px) 1320px, 100vw". */
  sizes: string;
  /**
   * Preload the poster: only for the hero on the page that shows it first. The poster is then the LCP image, and
   * the loop waits for the visitor's first scroll, touch, pointer move or key, so its first frame never replaces
   * the poster as the page's LCP (issue 170).
   */
  preloadPoster?: boolean;
  /** The poster's focal point (admin, D0 R3): the poster and the clip keep that part in view when cropped. */
  focal?: FocalPoint | undefined;
  className?: string;
};

/**
 * Muted background loop (HANDOFF, MOTION.md). The poster shows first; the video loads and plays only while
 * on screen and only when `canAutoplayVideo` allows it, then fades in over the poster (opacity only). A hero loop
 * (`preloadPoster`) starts on the visitor's first interaction.
 */
function SmartVideo({
  sources,
  poster,
  alt,
  sizes,
  preloadPoster = false,
  focal,
  className,
}: SmartVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduce = usePrefersReducedMotion();
  const allowed = useSyncExternalStore(
    subscribeToConnection,
    () => canAutoplayVideo(readConnection(), reduce),
    () => false,
  );
  const [playing, setPlaying] = useState(false);
  // The <video> element joins the page only after it has loaded and only near the viewport: a clip never competes
  // with the page's own load (WebKit held the load event on clips with preload="none", issue 259), and a clip
  // nobody scrolls to downloads nothing. The hero waits for the visitor's first move instead (D173).
  const [engaged, setEngaged] = useState(false);
  // A dynamic value from the data layer, so it is the one inline style here.
  const position = objectPositionOf(focal);
  const placed = position ? { objectPosition: position } : undefined;

  useEffect(() => {
    if (engaged || !allowed) return;
    if (preloadPoster) {
      const engage = () => setEngaged(true);
      for (const type of ENGAGE_EVENTS) {
        window.addEventListener(type, engage, { once: true, passive: true });
      }
      return () => {
        for (const type of ENGAGE_EVENTS) window.removeEventListener(type, engage);
      };
    }
    const container = containerRef.current;
    if (!container) return;
    let observer: IntersectionObserver | null = null;
    const watch = () => {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return;
          observer?.disconnect();
          setEngaged(true);
        },
        { rootMargin: "200px" },
      );
      observer.observe(container);
    };
    if (document.readyState === "complete") watch();
    else window.addEventListener("load", watch, { once: true });
    return () => {
      window.removeEventListener("load", watch);
      observer?.disconnect();
    };
  }, [engaged, allowed, preloadPoster]);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!allowed || !engaged || !container || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          video.play().catch(() => setPlaying(false));
        } else {
          video.pause();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [allowed, engaged]);

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden bg-mist-100", className)}>
      <Image
        src={poster}
        alt={alt}
        fill
        sizes={sizes}
        quality={PHOTO_QUALITY}
        preload={preloadPoster}
        fetchPriority={preloadPoster ? "high" : undefined}
        className="object-cover"
        style={placed}
      />
      {allowed && engaged ? (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
          onPlaying={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          style={placed}
          className={cn(
            "absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-500 ease-out",
            playing && "opacity-100",
          )}
        >
          {sources.webmMobile ? (
            <source src={sources.webmMobile} type="video/webm" media={PHONE_QUERY} />
          ) : null}
          {sources.mp4Mobile ? (
            <source src={sources.mp4Mobile} type="video/mp4" media={PHONE_QUERY} />
          ) : null}
          {sources.webm ? <source src={sources.webm} type="video/webm" /> : null}
          <source src={sources.mp4} type="video/mp4" />
        </video>
      ) : null}
    </div>
  );
}

export { SmartVideo };
