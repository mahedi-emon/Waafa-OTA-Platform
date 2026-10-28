import { formatTaka } from "@waafa/shared";

type ReportBarsProps = {
  /** Names the section; one page may show two of these (issue 244). */
  id?: string;
  title: string;
  days: Array<{ day: string; leads: number; orders: number; revenue: number }>;
  showRevenue: boolean;
  strings: { date: string; leads: string; orders: string; revenue: string; empty: string };
};

/**
 * Leads and orders per day as paired bars (issue 111), drawn with CSS so the admin needs no chart library; the
 * numbers are in a visually hidden table for screen readers.
 */
function ReportBars({ id = "report-per-day", title, days, showRevenue, strings }: ReportBarsProps) {
  const peak = Math.max(1, ...days.map((day) => Math.max(day.leads, day.orders)));
  return (
    <section
      aria-labelledby={id}
      className="flex min-w-0 flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={id} className="font-display text-lg font-bold text-navy-900">
          {title}
        </h2>
        <p className="flex items-center gap-3 text-[13px] text-mist-600">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2.5 rounded-sm bg-electric-600" />
            {strings.leads}
          </span>
          {showRevenue ? (
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2.5 rounded-sm bg-navy-900" />
              {strings.orders}
            </span>
          ) : null}
        </p>
      </div>
      {/* A range with nothing in it says so instead of an empty frame (D0 R10). */}
      {days.every((day) => day.leads === 0 && day.orders === 0) ? (
        <p className="text-[14px] text-mist-600">{strings.empty}</p>
      ) : null}
      <div aria-hidden="true" className="overflow-x-auto">
        <div
          className="flex h-40 min-w-full items-end gap-1"
          style={{ width: `${days.length * 14}px` }}
        >
          {days.map((day) => (
            <div key={day.day} className="flex h-full flex-1 items-end gap-px" title={day.day}>
              <span
                className="w-1/2 rounded-t-sm bg-electric-600"
                style={{ height: `${(day.leads / peak) * 100}%` }}
              />
              {showRevenue ? (
                <span
                  className="w-1/2 rounded-t-sm bg-navy-900"
                  style={{ height: `${(day.orders / peak) * 100}%` }}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">{strings.date}</th>
            <th scope="col">{strings.leads}</th>
            {showRevenue ? <th scope="col">{strings.orders}</th> : null}
            {showRevenue ? <th scope="col">{strings.revenue}</th> : null}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.day}>
              <th scope="row">{day.day}</th>
              <td>{day.leads}</td>
              {showRevenue ? <td>{day.orders}</td> : null}
              {showRevenue ? <td>{formatTaka(day.revenue)}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export { ReportBars };
