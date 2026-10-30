import type { ComponentProps } from "react";
import { getLocale } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";

type LocalLinkProps = Omit<ComponentProps<"a">, "href"> & {
  href: Parameters<typeof getPathname>[0]["href"];
  /**
   * false: never fetched ahead (heavy pages). "full": the page's own content is fetched ahead too, not only the route's
   * shared shell, so a card's photo can morph into it (issue 256).
   */
  prefetch?: boolean | "full" | null;
  /** false: keep the scroll position (tabs and filters on the same page). */
  scroll?: boolean;
  /** Replace the history entry instead of adding one. */
  replace?: boolean;
};

/**
 * The link for Server Components (issue 236): a plain <a> with its locale prefix worked out on the server. One listener
 * for the whole document (`NavDriver`) turns clicks on `a[data-nav]` into client-side navigation and fetches a page
 * ahead when the pointer, a finger or the keyboard reaches its link. next/link hydrated one client component per link
 * (160 on the home page). Client components keep using `Link` from `@/i18n/navigation`.
 */
async function LocalLink({ href, prefetch, scroll, replace, ...props }: LocalLinkProps) {
  const external = typeof href === "string" && !href.startsWith("/");
  const target = external ? (href as string) : getPathname({ href, locale: await getLocale() });
  return (
    <a
      href={target}
      {...(external ? {} : { "data-nav": "" })}
      {...(prefetch === false ? { "data-nav-prefetch": "false" } : {})}
      {...(prefetch === "full" ? { "data-nav-prefetch": "full" } : {})}
      {...(scroll === false ? { "data-nav-scroll": "false" } : {})}
      {...(replace ? { "data-nav-replace": "" } : {})}
      {...props}
    />
  );
}

export { LocalLink };
