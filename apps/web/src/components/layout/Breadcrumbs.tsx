import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "cn";
import { JsonLd } from "@/components/seo/JsonLd";
import { Link } from "@/i18n/navigation";
import { absoluteUrl } from "@/lib/siteUrl";

type Crumb = { label: string; href?: string };

type BreadcrumbsProps = {
  /** Trail after Home; the last item is the current page (no link). */
  items: Crumb[];
  className?: string;
};

/**
 * Breadcrumbs on every page except Home (PRD §6), with BreadcrumbList structured data. On phones the trail scrolls
 * sideways in one line instead of wrapping.
 */
async function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const t = await getTranslations("Layout");
  const trail: Crumb[] = [{ label: t("home"), href: "/" }, ...items];

  return (
    <nav aria-label={t("breadcrumbs")} className={cn("min-w-0", className)}>
      <ol className="flex [scrollbar-width:none] items-center gap-1 overflow-x-auto text-[13.5px] whitespace-nowrap text-mist-600">
        {trail.map((crumb, index) => {
          const last = index === trail.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {crumb.href && !last ? (
                <Link
                  href={crumb.href}
                  className="inline-flex min-h-9 items-center rounded-md px-0.5 transition-colors duration-150 hover:text-navy-900 focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className="font-semibold text-navy-900"
                >
                  {crumb.label}
                </span>
              )}
              {last ? null : <ChevronRight aria-hidden="true" className="size-3.5 text-mist-400" />}
            </li>
          );
        })}
      </ol>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: trail.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.label,
            ...(crumb.href ? { item: absoluteUrl(crumb.href) } : {}),
          })),
        }}
      />
    </nav>
  );
}

export { Breadcrumbs };
