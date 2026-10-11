import { expect, test } from "@playwright/test";

/*
 * First-load JavaScript per public route (#39, CLAUDE.md budgets): every script the page downloads until the load
 * event, counted as transferred (gzip) bytes from the production server. `nomodule` polyfills are skipped by modern
 * browsers and never requested here. The ceiling guards against regressions; the target stays 200 KB.
 */
const ROUTES = ["/", "/flights", "/tour-packages", "/visa-services", "/shop", "/contact"] as const;
const TARGET_KB = 200;
const CEILING_KB = Number(process.env.FIRST_LOAD_CEILING_KB ?? 380);

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
    expect(kb, `${route} first-load JS (KB gzip)`).toBeLessThanOrEqual(CEILING_KB);
  });
}
