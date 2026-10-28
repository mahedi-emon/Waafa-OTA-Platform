"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link } from "@/i18n/navigation";
import { activeKey, type AdminNavGroup, type AdminNavItem } from "@/lib/admin/navigation";
import { AdminNavIcon } from "./AdminNavIcon";
import { useAdminNav } from "./AdminNavContext";
import { useAdminInbox } from "./useAdminInbox";
import { countOf } from "./useInboxSummary";
import { useStoredValue } from "./useStoredValue";

const CLOSED_KEY = "waafa-admin-nav-closed";

function parseClosed(raw: string): string[] {
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function NavLink({ item, active }: { item: AdminNavItem; active: boolean }) {
  const t = useTranslations("Admin");
  const { summary } = useAdminInbox();
  const { isMobile, setOpenMobile } = useSidebar();
  const count = countOf(summary, item.badge);
  const urgent = countOf(summary, item.urgent);
  const label = t(`nav.${item.label}` as "nav.dashboard");
  const spoken = [
    count > 0 && item.badge ? t(`counts.${item.badge}` as "counts.newLeads", { count }) : null,
    urgent > 0 && item.urgent
      ? t(`counts.${item.urgent}` as "counts.newLeads", { count: urgent })
      : null,
  ].filter(Boolean);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={label}
        className={cn(
          "relative h-10 gap-3 rounded-lg px-3 text-[14.5px] text-mist-300 max-lg:h-11",
          "hover:bg-white/8 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-400",
          "data-[active=true]:bg-white/12 data-[active=true]:font-semibold data-[active=true]:text-white",
          "data-[active=true]:before:absolute data-[active=true]:before:inset-y-2 data-[active=true]:before:left-0",
          "data-[active=true]:before:w-[3px] data-[active=true]:before:rounded-full data-[active=true]:before:bg-cyan-400",
          count > 0 && "pr-11",
        )}
      >
        <Link
          href={item.href}
          prefetch={false}
          aria-current={active ? "page" : undefined}
          aria-label={spoken.length > 0 ? `${label}, ${spoken.join(", ")}` : undefined}
          onClick={() => {
            if (isMobile) setOpenMobile(false);
          }}
        >
          <AdminNavIcon name={item.icon} className="size-[18px] shrink-0" />
          <span className="truncate">{label}</span>
        </Link>
      </SidebarMenuButton>
      {count > 0 ? (
        <SidebarMenuBadge
          aria-hidden="true"
          className={cn(
            "top-2.5! right-2 h-5 min-w-5 rounded-full px-1.5 text-[11.5px] font-bold text-white max-lg:top-3!",
            urgent > 0 ? "bg-danger-600" : "bg-electric-600",
          )}
        >
          {count > 99 ? "99+" : count}
        </SidebarMenuBadge>
      ) : null}
    </SidebarMenuItem>
  );
}

function NavGroup({
  group,
  current,
  closed,
  onToggle,
}: {
  group: AdminNavGroup;
  current: string | null;
  closed: boolean;
  onToggle: (open: boolean) => void;
}) {
  const t = useTranslations("Admin");
  const { state, isMobile } = useSidebar();
  const holdsActive = group.items.some((item) => item.key === current);
  const iconsOnly = state === "collapsed" && !isMobile;
  const open = iconsOnly || !closed;

  // Opening a page inside a folded group unfolds it; staff can fold it again.
  useEffect(() => {
    if (holdsActive && closed) onToggle(true);
  }, [holdsActive, closed, onToggle]);
  const label = t(`nav.${group.label}` as "nav.home");

  return (
    <Collapsible open={open} onOpenChange={onToggle} asChild>
      <SidebarGroup className="py-1">
        <SidebarGroupLabel
          asChild
          className="h-9 rounded-lg px-3 text-[12.5px] font-semibold text-mist-400"
        >
          <CollapsibleTrigger
            disabled={iconsOnly}
            className="flex w-full cursor-pointer items-center justify-between hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-default"
          >
            {label}
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-4 transition-transform duration-150 motion-reduce:transition-none",
                !open && "-rotate-90",
              )}
            />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {group.items.map((item) => (
                <NavLink key={item.key} item={item} active={item.key === current} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

type AdminSidebarProps = { brand: ReactNode };

/**
 * The admin sidebar (ADMIN.md §3.1): Home, Inbox, Travel, Waafa’s World and Website as groups that fold away, count
 * badges where work waits, Settings in the footer. Folds to icons on desktop (Ctrl+B); a sheet below 1024 px.
 */
function AdminSidebar({ brand }: AdminSidebarProps) {
  const t = useTranslations("Admin");
  const nav = useAdminNav();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const current = activeKey(pathname, search ? `?${search}` : "", nav.items);
  const [closedRaw, setClosedRaw] = useStoredValue(CLOSED_KEY, "[]");
  const closed = useMemo(() => parseClosed(closedRaw), [closedRaw]);

  function toggle(label: string, open: boolean) {
    const next = open ? closed.filter((item) => item !== label) : [...new Set([...closed, label])];
    setClosedRaw(JSON.stringify(next));
  }

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-white/10 pb-3">{brand}</SidebarHeader>
      <SidebarContent className="gap-0 px-1 py-2">
        <nav aria-label={t("shell.nav")} className="flex flex-col">
          {nav.groups.map((group) => (
            <NavGroup
              key={group.label}
              group={group}
              current={current}
              closed={closed.includes(group.label)}
              onToggle={(open) => toggle(group.label, open)}
            />
          ))}
        </nav>
      </SidebarContent>
      {nav.settings ? (
        <SidebarFooter className="border-t border-white/10 px-2 py-2">
          <SidebarMenu>
            <NavLink item={nav.settings} active={current === nav.settings.key} />
          </SidebarMenu>
        </SidebarFooter>
      ) : null}
      <SidebarRail />
    </Sidebar>
  );
}

export { AdminSidebar };
