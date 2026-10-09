import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { sharedRules } from "./base.mjs";

/** Next.js apps: Core Web Vitals + TypeScript rules from eslint-config-next, plus the shared WAAFA rules. */
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      ...sharedRules,
      // Raw <img> skips next/image optimisation; SmartImage wraps next/image instead.
      "@next/next/no-img-element": "error",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
    "coverage/**",
  ]),
]);
