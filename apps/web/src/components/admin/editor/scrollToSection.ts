/** Scrolls a section into view (instantly under reduced motion) and moves focus to its first control. */
export function scrollToSection(id: string): void {
  const target = document.getElementById(`section-${id}`);
  if (!target) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  target
    .querySelector<HTMLElement>("input:not([type=hidden]), textarea, button, [tabindex='0']")
    ?.focus({ preventScroll: true });
}

/**
 * Scrolls to the field at a dotted path ("prices.2.price") and focuses it. List items with a problem stay open
 * (RepeaterField), and lines carry the same ids (LinesField), so every error's link has a field to reach.
 */
export function scrollToField(dotted: string): void {
  const id = `field-${dotted.replace(/[^\w-]/g, "-") || "root"}`;
  const target = document.getElementById(id) ?? document.getElementById(`${id}-label`);
  if (!target) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  if (target instanceof HTMLElement && typeof target.focus === "function")
    target.focus({ preventScroll: true });
}
