import type { LeadModule } from "@waafa/shared";
import { cn } from "cn";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import { queueSearch, withSearch } from "@/lib/admin/queues";

/** The tabs in the order of ADMIN.md §3.1; each person sees the modules they work on. */
const ORDER: LeadModule[] = [
  "flights",
  "hotels",
  "packages",
  "plan-trip",
  "visa",
  "printing",
  "trading",
  "bulk",
  "emi",
  "contact",
];

type LeadModuleTabsProps = {
  /** The list or board this switches. */
  path: string;
  current: LeadModule | undefined;
  /** Open leads per module (API), only the modules this person works on. */
  modules: Array<{ module: LeadModule; open: number }>;
  /** Other address parameters a switch keeps (the view and the search). */
  keep: Record<string, string | undefined>;
  labels: Record<LeadModule, string> & { all: string };
  /** Contains {count}: "3 open". */
  openLabel: string;
  label: string;
};

/**
 * The leads' service tabs (ADMIN.md §3.1, D0 R6): All, then each service with its open count, so a person sees
 * where work waits. A switch keeps the view and the search and starts again at page 1.
 */
function LeadModuleTabs({
  path,
  current,
  modules,
  keep,
  labels,
  openLabel,
  label,
}: LeadModuleTabsProps) {
  const open = new Map(modules.map((item) => [item.module, item.open]));
  const shown = ORDER.filter((module) => open.has(module));
  const hrefFor = (module: LeadModule | undefined) =>
    withSearch(path, queueSearch({ ...keep, module }));
  const total = [...open.values()].reduce((sum, count) => sum + count, 0);
  const tab = (module: LeadModule | undefined, text: string, count: number) => {
    const active = current === module;
    return (
      <Link
        key={module ?? "all"}
        href={hrefFor(module)}
        prefetch={false}
        aria-current={active ? "page" : undefined}
        className={cn(
          // relative: the count's screen-reader words stay inside the scrolling row (an absolute child would widen the page).
          "relative flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[14.5px] font-semibold transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
          active
            ? "bg-navy-900 text-white"
            : "bg-white text-navy-900 ring-1 ring-mist-200 hover:bg-mist-50",
        )}
      >
        {text}
        {count > 0 ? (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[12px] leading-none tabular-nums",
              active ? "bg-white/15 text-white" : "bg-electric-50 text-brand-700",
            )}
          >
            <span aria-hidden="true">{count}</span>
            <span className="sr-only">{openLabel.replace("{count}", String(count))}</span>
          </span>
        ) : null}
      </Link>
    );
  };

  if (shown.length < 2) return null;
  return (
    <nav
      aria-label={label}
      className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pr-8 pb-1 max-lg:[mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)]"
    >
      {tab(undefined, labels.all, total)}
      {shown.map((module) => tab(module, labels[module], open.get(module) ?? 0))}
    </nav>
  );
}

export { LeadModuleTabs };
