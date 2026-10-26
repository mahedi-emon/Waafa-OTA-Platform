import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { PHOTO_HOSTS } from "./src/lib/admin/mediaAddress";
import { PHOTO_QUALITY } from "./src/lib/media/imageQuality";
import { securityHeaders } from "./src/lib/security/securityHeaders";

// Messages are compiled at build time (issue 236): the browser gets no ICU parser and formats without parsing.
// t.raw is not available with compiled messages; pass a placeholder back instead (t("x", { count: "{count}" })).
const withNextIntl = createNextIntlPlugin({
  requestConfig: "./src/i18n/request.ts",
  experimental: {
    messages: { path: "./messages", format: "json", locales: "infer", precompile: true },
  },
});

/** The Docker image (deploy/compose.yml) builds a standalone server; local and CI builds keep `next start`. */
const standalone = process.env.NEXT_OUTPUT === "standalone";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactStrictMode: true,
  poweredByHeader: false,
  // The Docker image runs behind nginx, which compresses (deploy/nginx, issue 126); elsewhere Next does it.
  compress: !standalone,
  // Workspace packages ship TypeScript source; Next compiles them with the app.
  transpilePackages: ["@waafa/shared", "@waafa/fixtures"],
  images: {
    formats: ["image/avif", "image/webp"],
    // Photos at 65: about 28% smaller than 75 and the same to the eye (issue 185). The logo asks for 90 to stay crisp.
    qualities: [PHOTO_QUALITY, 90],
    // 1440 serves full-width banners on common laptops; 2560 is the largest an upload can be, so nothing asks for 3840.
    deviceSizes: [640, 750, 828, 1080, 1200, 1440, 1920, 2560],
    // A month: an uploaded photo gets a new name when it changes, and a deploy starts with an empty image cache.
    minimumCacheTTL: 2_678_400,
    // Photo fields may link a photo on Unsplash or Pexels (D0 R3); every other photo is uploaded to the library.
    remotePatterns: PHOTO_HOSTS.map((hostname) => ({ protocol: "https" as const, hostname })),
  },
  // Visa moved from /visa-services to /visa (issue 176): old links, bookmarks and search results keep working.
  async redirects() {
    return [
      { source: "/visa-services", destination: "/visa", permanent: true },
      { source: "/visa-services/:path*", destination: "/visa/:path*", permanent: true },
      { source: "/:locale(en|bn)/visa-services", destination: "/:locale/visa", permanent: true },
      {
        source: "/:locale(en|bn)/visa-services/:path*",
        destination: "/:locale/visa/:path*",
        permanent: true,
      },
    ];
  },
  // CSP and hardening headers on every route (issue 102); https upgrades follow NEXT_PUBLIC_SITE_URL.
  async headers() {
    const base = {
      development: process.env.NODE_ENV === "development",
      https: (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://"),
    };
    return [
      // Public pages may be framed by the site itself only: the admin's live previews (D0 R7, D243).
      { source: "/:path*", headers: securityHeaders({ ...base, framing: "self" }) },
      // The admin shows the site in its previews and is never framed itself. The later entry wins for the same
      // header names.
      ...["/secure-admin-control/:path*", "/:locale(en|bn)/secure-admin-control/:path*"].map(
        (source) => ({
          source,
          headers: securityHeaders({ ...base, framing: "none", framesSite: true }),
        }),
      ),
    ];
  },
  ...(standalone
    ? {
        output: "standalone" as const,
        // Trace from the monorepo root (builds run in apps/web) so the image gets the workspace packages.
        outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
      }
    : {}),
};

export default withNextIntl(nextConfig);
