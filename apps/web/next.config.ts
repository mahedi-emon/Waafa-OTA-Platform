import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** The Docker image (deploy/compose.yml) builds a standalone server; local and CI builds keep `next start`. */
const standalone = process.env.NEXT_OUTPUT === "standalone";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactStrictMode: true,
  poweredByHeader: false,
  // Workspace packages ship TypeScript source; Next compiles them with the app.
  transpilePackages: ["@waafa/shared", "@waafa/fixtures"],
  images: {
    formats: ["image/avif", "image/webp"],
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
