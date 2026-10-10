/**
 * Home hero flight path (MOTION.md §8): a 1.5 px sky line draws once from the end of the headline towards the media
 * panel and the search card, then a small dot rides the last fifth of it and settles. Server-rendered SVG with CSS
 * and SVG animation only (no JavaScript), decorative, never on the LCP element. Reduced motion: drawn, no dot travel.
 * Desktop only (D140): on phones the headline fills the width and the line would cross the text.
 */
function FlightPath() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 600 200"
      className="pointer-events-none absolute top-6 right-0 hidden w-[42%] max-w-[560px] lg:block xl:top-10"
    >
      <path
        id="home-flight-path"
        d="M 8 150 C 150 150 190 40 320 46 S 520 150 592 192"
        pathLength={1}
        fill="none"
        className="animate-[draw_1.2s_cubic-bezier(0.22,1,0.36,1)_300ms_forwards] stroke-sky-500 [stroke-dasharray:1] [stroke-dashoffset:1]"
        strokeWidth={1.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle r={5} opacity={0} className="fill-sky-500 motion-reduce:hidden">
        <set attributeName="opacity" to="1" begin="1.26s" fill="freeze" />
        <animateMotion
          begin="1.26s"
          dur="0.6s"
          fill="freeze"
          keyPoints="0.8;1"
          keyTimes="0;1"
          calcMode="spline"
          keySplines="0.22 1 0.36 1"
        >
          <mpath href="#home-flight-path" />
        </animateMotion>
      </circle>
    </svg>
  );
}

export { FlightPath };
