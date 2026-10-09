import { cn } from "cn";
import type { MenuItem } from "@waafa/shared";
import { MenuIcon } from "@/components/icons/MenuIcon";
import { Link } from "@/i18n/navigation";

type MoreGridProps = {
  items: MenuItem[];
  className?: string;
};

/**
 * Three-column icon grid for the phone More sheet and the drawer (Home-m-more, Home-m-drawer boards). Each tile is a
 * 44 px icon square over a one-line label; the whole tile is the touch target.
 */
function MoreGrid({ items, className }: MoreGridProps) {
  return (
    <ul className={cn("grid grid-cols-3 gap-x-2 gap-y-4", className)}>
      {items
        .filter((item) => item.visible && item.href)
        .map((item) => (
          <li key={item.id}>
            <Link
              href={item.href ?? "/"}
              className="group/tile flex flex-col items-center gap-2 rounded-2xl px-1 py-1.5 text-center outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <span className="grid size-12 place-items-center rounded-2xl border border-mist-200 bg-mist-25 text-brand-700 transition-transform duration-150 group-active/tile:scale-95">
                <MenuIcon name={item.icon} className="size-[22px]" />
              </span>
              <span className="text-[13px] leading-tight font-semibold text-navy-900">
                {item.label}
              </span>
            </Link>
          </li>
        ))}
    </ul>
  );
}

export { MoreGrid };
