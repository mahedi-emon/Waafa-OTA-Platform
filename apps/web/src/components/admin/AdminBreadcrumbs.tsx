"use client";

import { Fragment } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "@/i18n/navigation";
import { activeKey, groupOf } from "@/lib/admin/navigation";
import { useOptionalAdminNav } from "./AdminNavContext";

type Crumb = { label: string; href?: string };

type AdminBreadcrumbsProps = {
  /** The page's parent list when it isn't the sidebar item itself (e.g. a record's list). */
  back?: { href: string; label: string };
  /** The page title as plain text, for the last crumb on detail pages. */
  current?: string;
};

/**
 * Where am I (ADMIN.md §3.2): group › list › record, from the sidebar the person sees. The dashboard has none; the
 * last crumb is the current page (aria-current), the others are links.
 */
function AdminBreadcrumbs({ back, current }: AdminBreadcrumbsProps) {
  const t = useTranslations("Admin");
  const nav = useOptionalAdminNav();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  if (!nav) return null;

  const key = activeKey(pathname, search ? `?${search}` : "", nav.items);
  if (!key || key === "dashboard") return null;
  const item = nav.items.find((candidate) => candidate.key === key);
  if (!item) return null;
  const group = groupOf(nav.groups, key);
  const path = pathname.replace(/^\/[a-z]{2}(?=\/secure-admin-control)/, "");
  const [itemPath] = item.href.split("?");
  const onItemPage =
    path === itemPath && (!item.href.includes("?") || `${path}?${search}`.startsWith(item.href));

  const crumbs: Crumb[] = [];
  if (group) crumbs.push({ label: t(`nav.${group.label}` as "nav.home") });
  const itemLabel = t(`nav.${item.label}` as "nav.dashboard");
  crumbs.push(onItemPage && !back ? { label: itemLabel } : { label: itemLabel, href: item.href });
  if (back && back.href.split("?")[0] !== itemPath)
    crumbs.push({ label: back.label, href: back.href });
  if (!onItemPage && current) crumbs.push({ label: current });

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap text-[13.5px] text-mist-600">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <Fragment key={`${crumb.label}-${index}`}>
              <BreadcrumbItem
                className={last ? "min-w-0" : "shrink-0 max-sm:[&:not(:nth-last-child(3))]:hidden"}
              >
                {last ? (
                  <BreadcrumbPage className="truncate font-semibold text-navy-900">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : crumb.href ? (
                  <BreadcrumbLink asChild>
                    <Link
                      href={crumb.href}
                      prefetch={false}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </BreadcrumbItem>
              {last ? null : (
                <BreadcrumbSeparator className="max-sm:[&:not(:nth-last-child(2))]:hidden" />
              )}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export { AdminBreadcrumbs };
