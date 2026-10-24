"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Pencil } from "lucide-react";
import { sectionEditHref } from "@/lib/admin/editLinks";

type Box = {
  mark: string;
  href: string;
  label: string;
  top: number;
  left: number;
  width: number;
  height: number;
};

/** The marked sections of the page, measured on their first child (the mark itself is `display: contents`). */
function measure(labels: Record<string, string>): Box[] {
  const boxes: Box[] = [];
  for (const element of document.querySelectorAll<HTMLElement>("[data-edit]")) {
    const mark = element.dataset.edit ?? "";
    const href = sectionEditHref(mark);
    const label = labels[mark.replace(/^homeSections:/, "")];
    const first = element.firstElementChild;
    if (!href || !label || !(first instanceof HTMLElement)) continue;
    const rect = first.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    boxes.push({
      mark,
      href,
      label,
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
    });
  }
  return boxes;
}

/**
 * "Edit sections" (D0 R7): a dashed outline around each home section with a link that opens its sheet in the admin.
 * Measured again whenever the page changes size.
 */
function SectionOutlines({ labels }: { labels: Record<string, string> }) {
  const [boxes, setBoxes] = useState<Box[]>([]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setBoxes(measure(labels)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [labels]);

  return createPortal(
    <div data-staff-outlines="" className="pointer-events-none absolute top-0 left-0 z-20">
      {boxes.map((box) => (
        <div
          key={box.mark}
          className="absolute outline-2 -outline-offset-2 outline-electric-600 outline-dashed"
          style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
        >
          <a
            href={box.href}
            className="pointer-events-auto absolute top-3 left-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-electric-600 px-4 text-[14px] font-semibold text-white shadow-[0_10px_24px_-12px_rgb(10_37_64/0.7)] transition-colors duration-150 hover:bg-brand-700 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Pencil aria-hidden="true" className="size-4" />
            {box.label}
          </a>
        </div>
      ))}
    </div>,
    document.body,
  );
}

export { SectionOutlines };
