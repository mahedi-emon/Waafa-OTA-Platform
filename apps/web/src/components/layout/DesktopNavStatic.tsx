import { ChevronDownIcon } from "@/components/icons/serverIcons";
import { cn } from "cn";
import { navigationMenuTriggerStyle } from "@/components/ui/navigationMenuTriggerStyle";
import { LocalLink as Link } from "@/components/nav/LocalLink";
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
            ) : (
              // A panel without a page (More): the same trigger, so the header keeps its width when the interactive
              // menu takes over (issue 142); it opens once the page is interactive.
              <li key={item.id} className="static">
                <button
                  type="button"
                  aria-haspopup="menu"
                  className={cn(navigationMenuTriggerStyle(), "group", CURRENT_TEXT)}
                >
                  {item.label}
                  <ChevronDownIcon
                    className="relative top-px size-3.5 text-mist-500"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ),
          )}
        </ul>
      </div>
    </nav>
  );
}

export { DesktopNavStatic };
