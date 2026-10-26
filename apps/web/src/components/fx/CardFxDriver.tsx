"use client";

import { useEffect } from "react";

const MAX_TILT_DEG = 4;

/**
 * The one pointer listener behind every `CardFx` card (issue 236): with a mouse it writes the glow position as CSS
 * variables and, for tilt cards, a transform, once per frame (compositor work only, no React re-render). Phones and
 * pens never attach it.
 */
function CardFxDriver() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let frame = 0;
    let active: HTMLElement | null = null;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const reset = () => {
      cancelAnimationFrame(frame);
      if (active) active.style.transform = "";
      active = null;
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const target = event.target instanceof Element ? event.target : null;
      const card = target?.closest<HTMLElement>("[data-card-fx]") ?? null;
      if (card !== active) reset();
      if (!card) return;
      active = card;
      const box = card.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width;
      const y = (event.clientY - box.top) / box.height;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        card.style.setProperty("--spot-x", `${(x * 100).toFixed(1)}%`);
        card.style.setProperty("--spot-y", `${(y * 100).toFixed(1)}%`);
        if (card.dataset.cardFx === "tilt" && !reduce.matches) {
          const rotateX = ((0.5 - y) * MAX_TILT_DEG * 2).toFixed(2);
          const rotateY = ((x - 0.5) * MAX_TILT_DEG * 2).toFixed(2);
          card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        }
      });
    };

    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", reset);
    return () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", reset);
      reset();
    };
  }, []);
  return null;
}

export { CardFxDriver };
