import { ChevronDownIcon } from "lucide-react";
import { cn } from "cn";
import { navigationMenuTriggerStyle } from "@/components/ui/navigationMenuTriggerStyle";
import { Link } from "@/i18n/navigation";
import { CurrentMarker } from "./CurrentMarker";
import { CURRENT_BAR, CURRENT_TEXT, type DesktopNavItem } from "./desktopNavStyles";

type DesktopNavStaticProps = {
  items: DesktopNavItem[];
  label: string;
  currentLabel: string;
  className?: string;
};

/**
 * The header nav as plain links (issue 91): what the server renders and what phones keep, so the Radix menu with
 * its hover panels loads only on desktop screens. Panel items link to their section until the menu takes over;
 * the markup and classes match the Radix menu, so the swap is invisible.
 */
function DesktopNavStatic({ items, label, currentLabel, className }: DesktopNavStaticProps) {
  return (
    <nav
      aria-label={label}
      className={cn(
        "group/navigation-menu static flex max-w-none flex-none items-center justify-center",
        className,
      )}
    >
      <div className="static">
        <ul className="group flex flex-1 list-none items-center justify-center gap-0.5">
          {items.map((item) =>
            item.href ? (
              <li key={item.id} className={item.panel ? "static" : "relative"}>
                <Link
                  href={item.href}
                  className={cn(navigationMenuTriggerStyle(), item.panel && "group", CURRENT_TEXT)}
                >
                  {item.label}
                  <CurrentMarker href={item.href} label={currentLabel} barClassName={CURRENT_BAR} />
                  {item.panel ? (
                    <ChevronDownIcon
                      className="relative top-px size-3.5 text-mist-500"
                      aria-hidden="true"
                    />
                  ) : null}
                </Link>
              </li>
            ) : null,
          )}
        </ul>
      </div>
    </nav>
  );
}

export { DesktopNavStatic };
