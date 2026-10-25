import { cn } from "cn";

type SparklineProps = { values: readonly number[]; className?: string };

const WIDTH = 100;
const HEIGHT = 32;

/** A small trend line under a KPI (14 days). Decorative: the card's words carry the meaning. */
function Sparkline({ values, className }: SparklineProps) {
  if (values.length < 2) return null;
  const peak = Math.max(1, ...values);
  const step = WIDTH / (values.length - 1);
  const points = values.map(
    (value, index) =>
      `${(index * step).toFixed(2)},${(HEIGHT - 2 - (value / peak) * (HEIGHT - 4)).toFixed(2)}`,
  );
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className={cn("h-8 w-full overflow-visible text-electric-600", className)}
    >
      <polygon
        points={`0,${HEIGHT} ${points.join(" ")} ${WIDTH},${HEIGHT}`}
        className="fill-electric-50"
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export { Sparkline };
