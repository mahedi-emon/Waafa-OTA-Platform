import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const isCI = Boolean(process.env.CI);
/**
 * Firefox and WebKit (NFR-COMP, issue 259): the visitor flows that matter most, in the full suite only
 * (`CROSS_BROWSER=1`, main, nightly and full-ci), so the default run stays Chromium.
 */
const crossBrowser = process.env.CROSS_BROWSER === "1";
const CROSS_BROWSER_SPECS =
  /[\\/](smoke|home|search|flights|hotels|packages|visa|store|payments|bangla|morph)\.spec\.ts$/;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    // Signs the seed Super Admin in once and keeps the trusted-device cookie (two-step sign-in, issue 234).
    { name: "setup", testMatch: /staff\.setup\.ts$/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/staff-device.json" },
      dependencies: ["setup"],
    },
    ...(crossBrowser
      ? [
          {
            name: "firefox",
            use: { ...devices["Desktop Firefox"] },
            testMatch: CROSS_BROWSER_SPECS,
          },
          { name: "webkit", use: { ...devices["Desktop Safari"] }, testMatch: CROSS_BROWSER_SPECS },
        ]
      : []),
  ],
  // Runs against the production build (`pnpm build` first), the way visitors get it.
  webServer: {
    command: `pnpm exec next start --port ${PORT}`,
    // Many tests submit forms from one address; raise the per-client limits for the test server only.
    env: { RATE_LIMIT_FACTOR: "50" },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
