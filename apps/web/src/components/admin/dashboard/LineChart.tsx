type LineChartProps = {
  /** The chart's name, for the table that reads it out. */
  label: string;
  points: ReadonlyArray<{ day: string; label: string; value: number }>;
  strings: { table: string; day: string; value: string };
};

const WIDTH = 640;
const HEIGHT = 180;
const PAD = { top: 8, bottom: 4 };

/**
 * Leads by day as a line (ADMIN.md §5.2), drawn on the server without a chart library: three grid lines, the first,
 * middle and last day under it, and the same numbers as a table one click away. The tick positions are the one
 * dynamic style (a percentage of the chart's height).
 */
function LineChart({ label, points, strings }: LineChartProps) {
  const peak = Math.max(1, ...points.map((point) => point.value));
  const top = Math.max(2, Math.ceil(peak / 2) * 2);
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const step = points.length > 1 ? WIDTH / (points.length - 1) : 0;
  const x = (index: number) => index * step;
  const y = (value: number) => PAD.top + innerHeight - (value / top) * innerHeight;
  const line = points.map((point, index) => `${x(index).toFixed(1)},${y(point.value).toFixed(1)}`);
  const ticks = [0, top / 2, top];
  const labelled = new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]);

  return (
    <div className="flex flex-col gap-3">
      {/* Labels are HTML so they stay readable at every width; the SVG scales the line only. */}
      <div className="pl-8">
        <div className="relative">
          {ticks.map((tick) => (
            <span
              key={tick}
              aria-hidden="true"
              className="absolute -left-8 w-6 -translate-y-1/2 text-right text-[12px] text-mist-500 tabular-nums"
              style={{ top: `${(y(tick) / HEIGHT) * 100}%` }}
            >
              {tick}
            </span>
          ))}
          <svg
            role="img"
            aria-label={label}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            preserveAspectRatio="none"
            className="h-44 w-full overflow-visible text-electric-600"
          >
            {ticks.map((tick) => (
              <line
                key={tick}
                x1={0}
                x2={WIDTH}
                y1={y(tick)}
                y2={y(tick)}
                className="stroke-mist-200"
                strokeDasharray={tick === 0 ? undefined : "3 4"}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <polygon
              points={`${x(0)},${y(0)} ${line.join(" ")} ${x(points.length - 1)},${y(0)}`}
              className="fill-electric-50"
            />
            <polyline
              points={line.join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.25}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
        <div aria-hidden="true" className="mt-1.5 flex justify-between text-[12px] text-mist-500">
          {points
            .filter((_, index) => labelled.has(index))
            .map((point) => (
              <span key={point.day}>{point.label}</span>
            ))}
        </div>
      </div>
      <details>
        <summary className="cursor-pointer text-[13.5px] font-semibold text-brand-700">
          {strings.table}
        </summary>
        <table className="mt-2 w-full text-[13.5px]">
          <caption className="sr-only">{label}</caption>
          <thead>
            <tr className="border-b border-mist-200 text-left text-mist-600">
              <th scope="col" className="py-1.5 font-medium">
                {strings.day}
              </th>
              <th scope="col" className="py-1.5 text-right font-medium">
                {strings.value}
              </th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.day} className="border-b border-mist-100 last:border-0">
                <td className="py-1.5">{point.label}</td>
                <td className="py-1.5 text-right tabular-nums">{point.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

export { LineChart };
