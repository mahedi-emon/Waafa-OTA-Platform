import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { presetOf, rangePresets, type DayRange, type RangePreset } from "@/lib/admin/dateRanges";

type ReportRangeProps = {
  range: DayRange;
  /** Today in Dhaka, from the server, so the presets match the report. */
  today: string;
  path: string;
  strings: { label: string; from: string; to: string; show: string } & Record<RangePreset, string>;
};

/**
 * The report's date range (D0 R9): one tap for the common ranges, or two days and Show. Each choice is an address,
 * so a report can be shared or reopened as it was.
 */
function ReportRange({ range, today, path, strings }: ReportRangeProps) {
  const presets = rangePresets(today);
  const chosen = presetOf(range, presets);
  return (
    <section
      aria-label={strings.label}
      className="flex flex-col gap-4 rounded-2xl border border-mist-200 bg-white p-4 lg:flex-row lg:items-end lg:justify-between"
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
      <form action={path} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="report-from" className="text-[12.5px] text-mist-600">
            {strings.from}
          </Label>
          <Input
            id="report-from"
            type="date"
            name="from"
            defaultValue={range.from}
            max={today}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="report-to" className="text-[12.5px] text-mist-600">
            {strings.to}
          </Label>
          <Input
            id="report-to"
            type="date"
            name="to"
            defaultValue={range.to}
            max={today}
            required
          />
        </div>
        <Button type="submit" variant="navy">
          {strings.show}
        </Button>
      </form>
    </section>
  );
}

export { ReportRange };
