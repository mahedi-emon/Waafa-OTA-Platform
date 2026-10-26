import { cn } from "cn";
import { LocalLink as Link } from "@/components/nav/LocalLink";

type SettingsTabsProps = {
  label: string;
  tabs: ReadonlyArray<{ id: string; href: string; label: string }>;
  current: string;
};

/**
 * The parts of one settings section (Payment accounts · Delivery · EMI): links, each with its own address, so a part
 * can be shared and Back works. Hidden when a section has one part.
 */
function SettingsTabs({ label, tabs, current }: SettingsTabsProps) {
  if (tabs.length < 2) return null;
  return (
    // The parts wrap onto a second line on narrow phones, so no part is cut off (D0 R10).
    <nav aria-label={label} className="mb-5 border-b border-mist-200">
      <ul className="flex flex-wrap gap-x-1">
        {tabs.map((tab) => {
          const active = tab.id === current;
          return (
            <li key={tab.id} className="relative">
              <Link
                href={tab.href}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px flex min-h-11 items-center border-b-2 px-3 text-[14.5px] transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none motion-reduce:transition-none",
                  active
                    ? "border-electric-600 font-semibold text-navy-900"
                    : "border-transparent text-mist-600 hover:text-navy-900",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { SettingsTabs };
