import { expect, test } from "@playwright/test";

/*
 * First-load JavaScript per public route (#39, CLAUDE.md budgets): the scripts the page's HTML references, counted as
 * transferred (gzip) bytes from the production server (issue 224: not later prefetches). `nomodule` polyfills are skipped by modern
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
  "/visa": 205,
  "/shop": 230,
  "/contact": 315,
};
const ROUTES = Object.keys(CEILING_KB);

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

/**
 * The scripts a page's own HTML asks for: `<script src>` and `<link rel="preload|modulepreload" as="script">`
 * (issue 224). Scripts fetched later (idle-time prefetches of linked routes, code loaded on a tap) are not first-load
 * JS, and counting them made the number depend on timing.
 */
function referencedScripts(html: string, base: string): Set<string> {
  const urls = new Set<string>();
  const add = (src: string) => urls.add(new URL(src.replaceAll("&amp;", "&"), base).pathname);
  for (const match of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)) add(match[1] ?? "");
  for (const match of html.matchAll(/<link\b[^>]*>/g)) {
    const tag = match[0];
    if (!/\brel="(?:preload|modulepreload)"/.test(tag) || !/\bas="script"/.test(tag)) continue;
    const href = /\bhref="([^"]+)"/.exec(tag)?.[1];
    if (href) add(href);
  }
  return urls;
}

for (const route of ROUTES) {
  test(`first-load JS on ${route}`, async ({ page }, testInfo) => {
    const sizes = new Map<string, Promise<number>>();
    page.on("requestfinished", (request) => {
      if (request.resourceType() !== "script") return;
      sizes.set(
        new URL(request.url()).pathname,
        request
          .sizes()
          .then((size) => size.responseBodySize)
          .catch(() => 0),
      );
    });
    const response = await page.goto(route, { waitUntil: "load" });
    const wanted = referencedScripts((await response?.text()) ?? "", page.url());
    expect(wanted.size, `${route} references its scripts`).toBeGreaterThan(0);
    let total = 0;
    for (const path of wanted) total += (await sizes.get(path)) ?? 0;
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
