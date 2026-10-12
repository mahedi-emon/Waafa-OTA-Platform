/** A small airliner seen from above, nose pointing right (+x), centred on 0,0 so `rotate="auto"` follows the path. */
const PLANE =
  "M14 0C14-1.6 12.5-2 11-2L3-2-5-13H-8.5L-3-2H-12L-15.5-6.5H-17.5L-15.5-1V1L-17.5 6.5H-15.5L-12 2H-3L-8.5 13H-5L3 2H11C12.5 2 14 1.6 14 0Z";

/** The route: a departure dot low on the left, climbing to the top right of the sky. */
const ROUTE = "M70 360C330 360 470 150 720 130S1010 120 1080 96";

/** Where the plane rests and its heading there (the tangent of the last curve), for the reduced-motion end state. */
const END = { x: 1080, y: 96, angle: -14 };

/**
 * Home hero flight path (MOTION.md §8, issue 148): drawn inside the media panel's sky, so it never crosses the
 * headline, the lead or the Open now chip. A dashed white route draws from a departure dot towards the top right while
 * a small plane flies at its tip, then rests. Server-rendered SVG with CSS and SVG animation only (no JavaScript),
 * decorative, and separate from the LCP poster. Reduced motion: the route is drawn and the plane waits at the end.
 */
function FlightPath() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1200 420"
      preserveAspectRatio="xMidYMin meet"
      className="pointer-events-none absolute inset-x-0 top-[12%] h-[62%] w-full drop-shadow-[0_2px_6px_rgb(2_13_57/0.35)]"
    >
      <defs>
        {/* The solid stroke draws in and reveals the dashed route underneath it. */}
        <mask id="home-flight-reveal" maskUnits="userSpaceOnUse">
          <path
            d={ROUTE}
            pathLength={1}
            fill="none"
            stroke="white"
            strokeWidth={12}
            className="animate-[draw_2.2s_cubic-bezier(0.45,0,0.2,1)_600ms_forwards] [stroke-dasharray:1] [stroke-dashoffset:1] motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]"
          />
        </mask>
      </defs>
      <path
        id="home-flight-path"
        d={ROUTE}
        fill="none"
        mask="url(#home-flight-reveal)"
        className="stroke-white/90"
        strokeWidth={2}
        strokeDasharray="2 10"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={70} cy={360} r={6} className="fill-white" />
      <circle cx={70} cy={360} r={13} className="fill-none stroke-white/60" strokeWidth={1.5} />

      <g opacity={0} className="fill-white motion-reduce:hidden">
        <set attributeName="opacity" to="1" begin="0.6s" fill="freeze" />
        <animateMotion
          begin="0.6s"
          dur="2.2s"
          fill="freeze"
          rotate="auto"
          keyPoints="0;1"
          keyTimes="0;1"
          calcMode="spline"
          keySplines="0.45 0 0.2 1"
        >
          <mpath href="#home-flight-path" />
        </animateMotion>
        <path d={PLANE} transform="scale(1.35)" />
      </g>
      <path
        d={PLANE}
        transform={`translate(${END.x} ${END.y}) rotate(${END.angle}) scale(1.35)`}
        className="hidden fill-white motion-reduce:block"
      />
    </svg>
  );
}

export { FlightPath };
