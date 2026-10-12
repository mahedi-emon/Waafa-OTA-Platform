import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { securityHeaders } from "./src/lib/security/securityHeaders";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

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
  },
  // CSP and hardening headers on every route (issue 102); https upgrades follow NEXT_PUBLIC_SITE_URL.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders({
          development: process.env.NODE_ENV === "development",
          https: (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://"),
        }),
      },
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
