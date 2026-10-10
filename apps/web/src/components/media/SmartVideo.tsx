"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image, { type StaticImageData } from "next/image";
import { cn } from "cn";
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
  /** Preload the poster: only for the hero on the page that shows it first. */
  preloadPoster?: boolean;
  className?: string;
};

/**
 * Muted background loop (HANDOFF, MOTION.md). The poster shows first; the video loads and plays only while
 * on screen and only when `canAutoplayVideo` allows it, then fades in over the poster (opacity only).
 */
function SmartVideo({
  sources,
  poster,
  alt,
  sizes,
  preloadPoster = false,
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

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!allowed || !container || !video) return;

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
  }, [allowed]);

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden bg-mist-100", className)}>
      <Image
        src={poster}
        alt={alt}
        fill
        sizes={sizes}
        preload={preloadPoster}
        fetchPriority={preloadPoster ? "high" : undefined}
        className="object-cover"
      />
      {allowed ? (
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
