import { cn } from "cn";
import { AdminDateRange, type AdminDateRangeStrings } from "@/components/admin/AdminDateRange";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import { presetOf, rangePresets, type DayRange, type RangePreset } from "@/lib/admin/dateRanges";

type ReportRangeProps = {
  range: DayRange;
  /** Today in Dhaka, from the server, so the presets match the report. */
  today: string;
  path: string;
  strings: { label: string } & Record<RangePreset, string>;
  picker: AdminDateRangeStrings;
};

/**
 * The report's date range (D0 R9, issue 229): one tap for the common ranges, or any range from the themed picker
 * (dates read "12 Oct 2026", never the browser's mm/dd/yyyy). Each choice is an address, so a report can be shared or
 * reopened as it was.
 */
function ReportRange({ range, today, path, strings, picker }: ReportRangeProps) {
  const presets = rangePresets(today);
  const chosen = presetOf(range, presets);
  return (
    <section
      aria-label={strings.label}
      className="flex flex-col gap-4 rounded-2xl border border-mist-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between"
    >
      <ul className="flex flex-wrap gap-2">
        {(Object.keys(presets) as RangePreset[]).map((key) => (
          <li key={key}>
            <Link
              href={`${path}?from=${presets[key].from}&to=${presets[key].to}`}
              prefetch={false}
              aria-current={chosen === key ? "true" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full border px-4 text-[14px] font-medium transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none motion-reduce:transition-none",
                chosen === key
                  ? "border-navy-900 bg-navy-900 text-white"
                  : "border-mist-200 bg-white text-navy-900 hover:border-electric-200 hover:bg-electric-50",
              )}
            >
              {strings[key]}
            </Link>
          </li>
        ))}
      </ul>
      <AdminDateRange from={range.from} to={range.to} today={today} required strings={picker} />
    </section>
  );
}

export { ReportRange };
