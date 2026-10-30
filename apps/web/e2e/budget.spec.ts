import { expect, test } from "@playwright/test";

/*
 * First-load JavaScript per public route (#39, CLAUDE.md budgets): the scripts the page's HTML references, counted as
 * transferred (gzip) bytes from the production server (issue 224: not later prefetches). `nomodule` polyfills are
 * skipped by modern browsers and never requested here. Since issue 236 every public route must stay at 200 KB or less;
 * scripts/js-budget.mjs prints the same numbers for a local build.
 */
const TARGET_KB = 200;
const ROUTES = [
  "/",
  "/flights",
  "/flights/group-fares",
  "/flights/dhaka-to-dubai",
  "/hotels",
  "/tour-packages",
  "/tour-packages/bangkok-and-phuket",
  "/plan-my-trip",
  "/visa",
  "/visa/thailand",
  "/visa/thailand/apply",
  "/visa-guide",
  "/shop",
  "/shop/c/power-banks",
  "/shop/p/voltaro-power-bank-22-5w",
  "/shop/campaign/winter-office-week",
  "/hotels/sample-beach-resort-coxs-bazar",
  "/shop/cart",
  "/shop/checkout",
  "/track",
  "/shop/printing-solutions",
  "/shop/international-trading",
  "/blog",
  "/blog/coxs-bazar-long-weekend",
  "/gallery",
  "/contact",
  "/about-us",
  "/faqs",
  "/feedback",
  "/offline-payment",
  "/emi",
  "/login",
  "/account",
];

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
    expect(kb, `${route} first-load JS (KB gzip)`).toBeLessThanOrEqual(TARGET_KB);
  });
}

/*
 * One copy of the page's data in the HTML (issue 271): with Partial Prefetching on, Next rendered streamed pages twice
 * and embedded the second render as a runtime prefetch stream (the root payload's `p` field), which doubled the inline
 * payload and the work on phones. The field must stay absent.
 */
for (const route of ["/hotels", "/flights", "/blog"]) {
  test(`${route} embeds its data once`, async ({ request }) => {
    const html = await (await request.get(route)).text();
    expect(html).not.toMatch(/\\"p\\":\\"\$[0-9a-f]+\\"/);
  });
}
