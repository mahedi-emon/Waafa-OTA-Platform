/**
 * Store add to cart (MOTION.md §8): a 40 px ghost leaves the Add button and flies along an arc (x linear, y eased in)
 * to the visible cart target, the header cart on desktop or the tab bar's Waafas World disc on phones, in 600 ms.
 * Transform and opacity only; nothing happens under reduced motion or when no target is on screen.
 */
export function flyToCart(from: Element): void {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = [...document.querySelectorAll<HTMLElement>("[data-cart-target]")].find(
    (element) => {
      const box = element.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < window.innerHeight;
    },
  );
  if (!target) return;

  const start = from.getBoundingClientRect();
  const end = target.getBoundingClientRect();
  const size = 40;
  const x0 = start.left + start.width / 2 - size / 2;
  const y0 = start.top + start.height / 2 - size / 2;
  const dx = end.left + end.width / 2 - size / 2 - x0;
  const dy = end.top + end.height / 2 - size / 2 - y0;

  const ghost = document.createElement("span");
  ghost.setAttribute("aria-hidden", "true");
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${x0}px`,
    top: `${y0}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "9999px",
    background: "var(--color-electric-600)",
    boxShadow: "0 8px 18px -8px rgb(0 83 215 / 0.6)",
    pointerEvents: "none",
    zIndex: "100",
  });
  document.body.appendChild(ghost);

  const steps = 12;
  const keyframes = Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps;
    // y eases in (slow start, fast finish) while x moves evenly: the ghost lifts, then drops into the cart.
    const lift = Math.sin(Math.PI * t) * Math.min(80, Math.abs(dx) * 0.25 + 30);
    const x = dx * t;
    const y = dy * t * t - lift;
    const scale = 1 - 0.55 * t;
    return {
      transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
      opacity: t > 0.9 ? 0.2 : 1,
    };
  });
  const animation = ghost.animate(keyframes, { duration: 600, easing: "linear", fill: "forwards" });
  animation.onfinish = () => ghost.remove();
  animation.oncancel = () => ghost.remove();
}
