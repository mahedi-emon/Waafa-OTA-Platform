/* eslint-disable no-console -- a command-line tool that prints its report */
// Developer tool (issue 236): first-load JS (gzip) of public routes, counted like e2e/budget.spec.ts: the scripts
// the page's HTML references (module scripts and script preloads, not nomodule polyfills), from a production build.
//   node scripts/js-budget.mjs http://localhost:3200 [route ...]
import { readFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

const base = process.argv[2] ?? "http://localhost:3200";
const routes = process.argv.slice(3).length
  ? process.argv.slice(3)
  : [
      "/",
      "/flights",
      "/hotels",
      "/tour-packages",
      "/tour-packages/bangkok-and-phuket",
      "/visa",
      "/visa/thailand",
      "/visa/thailand/apply",
      "/shop",
      "/shop/p/voltaro-power-bank-22-5w",
      "/shop/c/power-banks",
      "/shop/cart",
      "/shop/checkout",
      "/shop/track",
      "/blog",
      "/blog/coxs-bazar-long-weekend",
      "/contact",
      "/about-us",
      "/faqs",
      "/gallery",
      "/group-fares",
      "/plan-my-trip",
      "/printing-solutions",
      "/international-trading",
      "/feedback",
      "/offline-payment",
      "/emi",
      "/visa-guide",
      "/flights/dhaka-to-dubai",
      "/login",
      "/account",
    ];
const chunks = path.resolve("apps/web/.next".startsWith("/") ? "apps/web/.next" : ".next");
const size = new Map();
const gz = (pathname) => {
  if (!size.has(pathname)) {
    try {
      size.set(
        pathname,
        gzipSync(readFileSync(path.join(chunks, pathname.replace(/^\/_next/, "")))).length,
      );
    } catch {
      size.set(pathname, 0);
    }
  }
  return size.get(pathname);
};
for (const route of routes) {
  const response = await fetch(`${base}${route}`, { redirect: "manual" });
  if (response.status >= 300) {
    console.log(`${route.padEnd(36)} ${response.status}`);
    continue;
  }
  const html = await response.text();
  const urls = new Set();
  for (const m of html.matchAll(/<script\b[^>]*>/g)) {
    const src = /\bsrc="([^"]+)"/.exec(m[0])?.[1];
    if (src && !/\bnomodule\b/i.test(m[0])) urls.add(src);
  }
  for (const m of html.matchAll(/<link\b[^>]*>/g)) {
    if (!/rel="(?:preload|modulepreload)"/.test(m[0]) || !/as="script"/.test(m[0])) continue;
    const href = /href="([^"]+)"/.exec(m[0])?.[1];
    if (href) urls.add(href);
  }
  let total = 0;
  for (const url of urls) total += gz(new URL(url.replaceAll("&amp;", "&"), base).pathname);
  const kb = Math.round(total / 1024);
  console.log(`${route.padEnd(36)} ${String(kb).padStart(4)} KB${kb > 200 ? "  over 200" : ""}`);
}
