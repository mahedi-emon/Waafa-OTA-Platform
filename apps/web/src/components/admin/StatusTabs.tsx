import { cn } from "cn";
import { LocalLink as Link } from "@/components/nav/LocalLink";

type StatusTabsProps = {
  label: string;
  items: Array<{ value: string; label: string; href: string }>;
  current: string;
};

/** Pill tabs that filter a list by status (orders, feedback, payment proofs); each is a shareable link. */
function StatusTabs({ label, items, current }: StatusTabsProps) {
  return (
    <nav
      aria-label={label}
      className="-mx-1 mb-4 flex gap-1 overflow-x-auto px-1 pr-8 pb-1 max-lg:[mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)]"
    >
      {items.map((item) => (
        <Link
          key={item.value}
          href={item.href}
          prefetch={false}
          aria-current={item.value === current ? "page" : undefined}
          className={cn(
            "flex min-h-11 shrink-0 items-center rounded-full px-4 text-[14.5px] font-semibold transition-colors duration-150",
            item.value === current
              ? "bg-navy-900 text-white"
              : "bg-white text-navy-900 ring-1 ring-mist-200 hover:bg-mist-50",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export { StatusTabs };
