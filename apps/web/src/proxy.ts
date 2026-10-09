import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/** Resolves the locale for every page request: unprefixed English paths are served from `/[locale]`. */
export default createMiddleware(routing);

export const config = {
  // Every path except API routes, Next.js internals, Vercel internals and files with an extension.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
