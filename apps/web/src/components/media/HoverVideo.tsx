"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "cn";
import { canAutoplayVideo, type ConnectionInfo } from "./videoPolicy";

type HoverVideoProps = {
  /** The package's clip (desktop files only: hover exists only with a mouse). */
  sources: { mp4: string; webm?: string };
  className?: string;
};

/**
 * Hover to preview (HANDOFF effect "hover-play card", package cards): when a mouse rests on the card, its muted
 * clip starts loading (preload none, so not before) and fades in over the cover photo; leaving pauses it and fades it out. Never on touch,
 * under reduced motion, with Save-Data or on a slow connection (the same policy as SmartVideo).
 */
function HoverVideo({ sources, className }: HoverVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = ref.current;
    const card = video?.closest("article");
    if (!video || !card) return;
    const allowed = () =>
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      canAutoplayVideo(
        (navigator as Navigator & { connection?: ConnectionInfo }).connection,
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      );
    const enter = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !allowed()) return;
      // preload="none": the first play is the first byte downloaded.
      video.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      );
    };
    const leave = () => {
      video.pause();
      setPlaying(false);
    };
    card.addEventListener("pointerenter", enter);
    card.addEventListener("pointerleave", leave);
    return () => {
      card.removeEventListener("pointerenter", enter);
      card.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      className={cn(
        "pointer-events-none absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-300",
        playing && "opacity-100",
        className,
      )}
    >
      {sources.webm ? <source src={sources.webm} type="video/webm" /> : null}
      <source src={sources.mp4} type="video/mp4" />
    </video>
  );
}

export { HoverVideo };
