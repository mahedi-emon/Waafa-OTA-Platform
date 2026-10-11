import { cn } from "cn";
const ARC = "M 14 50 Q 160 -10 306 50";
const PLANE =
  "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z";

/** The plane glyph centred on its origin, nose along +x (lucide's points north-east). */
const planeGlyph = (
  <g transform="rotate(45) scale(0.75) translate(-12 -12)">
    <path
      d={PLANE}
      className="fill-electric-600 stroke-white"
      strokeWidth={1.2}
      strokeLinejoin="round"
    />
  </g>
);

type RouteArcProps = {
  label: string;
  /** Overrides the size (the summary bar default is 200 px, 260 px from lg). */
  className?: string;
};

/**
 * Route arc (MOTION.md §8): the arc of the searched trip draws in 900 ms, then a small plane glides along it in
 * 1.6 s and rests at the destination. SVG and CSS only; reduced motion shows the arc drawn and the plane landed.
 */
function RouteArc({ label, className }: RouteArcProps) {
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 320 64"
      className={cn("h-auto w-[200px] shrink-0 lg:w-[260px]", className)}
    >
      <path
        id="route-arc"
        d={ARC}
        pathLength={1}
        fill="none"
        className="animate-[draw_900ms_cubic-bezier(0.22,1,0.36,1)_forwards] stroke-sky-500 [stroke-dasharray:1] [stroke-dashoffset:1]"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <circle cx={14} cy={50} r={4} className="fill-navy-900" />
      <circle cx={306} cy={50} r={4} className="fill-electric-600" />
      <g opacity={0} className="motion-reduce:hidden">
        <set attributeName="opacity" to="1" begin="0.9s" fill="freeze" />
        <animateMotion
          begin="0.9s"
          dur="1.6s"
          fill="freeze"
          rotate="auto"
          keyPoints="0;1"
          keyTimes="0;1"
          calcMode="spline"
          keySplines="0.65 0 0.35 1"
        >
          <mpath href="#route-arc" />
        </animateMotion>
        {planeGlyph}
      </g>
      <g className="hidden motion-reduce:block" transform="translate(306 50) rotate(22)">
        {planeGlyph}
      </g>
    </svg>
  );
}

export { RouteArc };
