"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "cn";
import { Link } from "@/i18n/navigation";
import { activeKey, type AdminNavGroup } from "@/lib/admin/navigation";
import { AdminNavIcon } from "./AdminNavIcon";

type AdminNavProps = {
  groups: AdminNavGroup[];
  /** Resolved labels: group and item message keys → text. */
  labels: Record<string, string>;
  label: string;
  onNavigate?: () => void;
};

/**
 * The admin sidebar links (AdminSide board): grouped, the current page marked with aria-current, on the navy panel.
 * Links are not prefetched, so a page and a burst of prefetches never race for the session refresh.
 */
function AdminNav({ groups, labels, label, onNavigate }: AdminNavProps) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const current = activeKey(pathname, search ? `?${search}` : "", groups);

  return (
    <nav aria-label={label} className="flex flex-col gap-5 px-3 py-4">
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[11px] font-semibold tracking-[0.12em] text-white/50 uppercase">
            {labels[group.label] ?? group.label}
          </p>
          {group.items.map((item) => {
            const active = item.key === current;
            return (
              <Link
                key={item.key}
                href={item.href}
                prefetch={false}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-[14.5px] font-medium transition-colors duration-150",
                  "focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none",
                  active
                    ? "bg-white/12 text-white"
                    : "text-white/75 hover:bg-white/6 hover:text-white",
                )}
              >
                <AdminNavIcon name={item.icon} />
                <span className="truncate">{labels[item.label] ?? item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export { AdminNav };
