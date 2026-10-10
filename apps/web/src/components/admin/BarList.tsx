type BarListProps = {
  rows: Array<{ key: string; label: string; value: number }>;
  empty: string;
};

/**
 * Horizontal bars for the dashboard (leads by module and status, top routes): label, bar scaled to the largest value
 * and the number, so the figures stay readable without a chart library (D137).
 */
function BarList({ rows, empty }: BarListProps) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  if (rows.length === 0) return <p className="text-[14px] text-mist-600">{empty}</p>;
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.key} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-[14px]">
            <span className="truncate text-ink-900">{row.label}</span>
            <span className="font-semibold text-navy-900 tabular-nums">{row.value}</span>
          </div>
          <div className="h-2 rounded-full bg-mist-100">
            <div
              className="h-2 rounded-full bg-electric-600"
              style={{ width: `${Math.max(4, Math.round((row.value / max) * 100))}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export { BarList };
