import { expect, test } from "@playwright/test";

/*
 * First-load JavaScript per public route (#39, CLAUDE.md budgets): every script the page downloads until the load
 * event, counted as transferred (gzip) bytes from the production server. `nomodule` polyfills are skipped by modern
 * browsers and never requested here. The ceilings guard against regressions; the target stays 200 KB.
 */
const TARGET_KB = 200;
/**
 * Measured in CI on 11 Oct after issue 91 (home 215, flights 338, packages 189, visa 186, shop 315, contact 298 KB)
 * plus a small margin: a regression fails CI; lower these as the bundles shrink. Issue 170 (13 Oct): flights 259 and
 * shop 215 KB once the hidden search card, the lead form's second step and validation, and the corporate quote form
 * load on demand.
 */
const CEILING_KB: Record<string, number> = {
  "/": 235,
  "/flights": 275,
  "/tour-packages": 205,
  "/visa-services": 205,
  "/shop": 230,
  "/contact": 315,
};
const ROUTES = Object.keys(CEILING_KB);

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

for (const route of ROUTES) {
  test(`first-load JS on ${route}`, async ({ page }, testInfo) => {
    const sizes: Array<Promise<number>> = [];
    page.on("requestfinished", (request) => {
      if (request.resourceType() !== "script") return;
      sizes.push(
        request
          .sizes()
          .then((size) => size.responseBodySize)
          .catch(() => 0),
      );
    });
    await page.goto(route, { waitUntil: "load" });
    const total = (await Promise.all(sizes)).reduce((sum, size) => sum + size, 0);
    const kb = Math.round(total / 1024);
    testInfo.annotations.push({
      type: "first-load-js",
      description: `${route}: ${kb} KB gzip (target ${TARGET_KB} KB)`,
    });
    process.stdout.write(`first-load JS ${route}: ${kb} KB gzip (target ${TARGET_KB} KB)\n`);
    expect(kb, `${route} first-load JS (KB gzip)`).toBeLessThanOrEqual(
      CEILING_KB[route] ?? TARGET_KB,
    );
  });
}
