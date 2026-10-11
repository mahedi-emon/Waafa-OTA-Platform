type ReportListProps = {
  title: string;
  rows: Array<{ label: string; value: number; display?: string }>;
  empty: string;
};

/** A ranked breakdown with proportional bars (issue 111). */
function ReportList({ title, rows, empty }: ReportListProps) {
  const peak = Math.max(1, ...rows.map((row) => row.value));
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5">
      <h2 className="font-display text-base font-bold text-navy-900">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-mist-600">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((row) => (
            <li key={row.label} className="flex min-w-0 flex-col gap-1">
              <span className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-ink-900">{row.label}</span>
                <span className="font-semibold text-navy-900 tabular-nums">
                  {row.display ?? row.value}
                </span>
              </span>
              <span aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-mist-100">
                <span
                  className="block h-full rounded-full bg-electric-600"
                  style={{ width: `${(row.value / peak) * 100}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export { ReportList };
