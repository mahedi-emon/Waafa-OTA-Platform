import type { ComponentProps } from "react";
import NextLink from "next/link";
import { getLocale } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";

type LocalLinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & {
  href: Parameters<typeof getPathname>[0]["href"];
};

/**
 * The link for Server Components (issue 236): the locale prefix is worked out on the server and the browser gets a
 * plain next/link. next-intl's Link is a client wrapper around next/link; a page with 160 links hydrated both, which
 * cost about a third of the home page's start-up work. Client components keep using `Link` from `@/i18n/navigation`.
 */
async function LocalLink({ href, ...props }: LocalLinkProps) {
  // Outside addresses, mail and phone links and in-page anchors pass through as they are.
  if (typeof href === "string" && !href.startsWith("/")) return <NextLink href={href} {...props} />;
  const locale = await getLocale();
  return <NextLink href={getPathname({ href, locale })} {...props} />;
}

export { LocalLink };
