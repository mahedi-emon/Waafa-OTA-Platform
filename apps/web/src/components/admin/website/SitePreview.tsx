"use client";

import { useRef } from "react";

type SitePreviewProps = {
  /** The public page to show ("/"). */
  path: string;
  /** The `data-edit` mark of the part to scroll to ("homeSections:offers", "hero"). */
  focus: string;
  /** Changes after a save, so the page loads again with the saved words. */
  reloadKey: number;
  title: string;
};

/**
 * The public page in a frame at phone width, scrolled to the part being edited (D0 R7). Staff see what visitors see
 * once a save has reached the site (a few seconds); the site allows this frame only for signed-in staff (D243).
 */
function SitePreview({ path, focus, reloadKey, title }: SitePreviewProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const scrollToPart = () => {
    try {
      const view = frame.current?.contentWindow;
      const page = frame.current?.contentDocument;
      const part = page?.querySelector(`[data-edit="${focus}"]`);
      const box = part?.firstElementChild ?? part;
      if (!view || !page || !box) return;
      // Only the frame scrolls (scrollIntoView would also scroll the sheet around it), clear of the sticky header.
      const header = page.querySelector("header")?.getBoundingClientRect().height ?? 0;
      const top = box.getBoundingClientRect().top + view.scrollY - header;
      view.scrollTo({ top: Math.max(0, top), behavior: "instant" });
    } catch {
      // A page from another origin can't be scrolled from here; it simply shows from the top.
    }
  };
  return (
    <div className="overflow-hidden rounded-xl border border-mist-200 bg-mist-50">
      {/* A picture to look at and scroll, not a second page to tab through before Save. */}
      <iframe
        key={reloadKey}
        ref={frame}
        src={path}
        title={title}
        loading="lazy"
        tabIndex={-1}
        onLoad={scrollToPart}
        className="block h-[min(70vh,640px)] w-full bg-white"
      />
    </div>
  );
}

export { SitePreview };
