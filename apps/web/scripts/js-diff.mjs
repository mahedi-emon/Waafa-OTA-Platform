/* eslint-disable no-console -- a command-line tool that prints its report */
// Developer tool (issue 236): the scripts one route loads that another doesn't, with gzip sizes and a hint of what
// each holds. Usage: node scripts/js-diff.mjs http://localhost:3200 /visa /contact
import { readFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

const [base, from, to] = process.argv.slice(2);
const scripts = async (route) => {
  const html = await (await fetch(`${base}${route}`)).text();
  const urls = new Set();
  for (const m of html.matchAll(/<script\b[^>]*>/gi)) {
    const src = /\bsrc="([^"]+)"/.exec(m[0])?.[1];
    if (src && !/\bnomodule\b/i.test(m[0])) urls.add(src);
  }
  for (const m of html.matchAll(
    /<link\b[^>]*rel="(?:preload|modulepreload)"[^>]*as="script"[^>]*>/gi,
  )) {
    const href = /href="([^"]+)"/.exec(m[0])?.[1];
    if (href) urls.add(href);
  }
  return new Set([...urls].map((u) => new URL(u.replaceAll("&amp;", "&"), base).pathname));
};
const a = await scripts(from);
const b = await scripts(to);
let total = 0;
const rows = [];
for (const pathname of b) {
  if (a.has(pathname)) continue;
  const code = readFileSync(path.join(".next", pathname.replace(/^\/_next/, "")));
  const size = gzipSync(code).length;
  total += size;
  const text = code.toString("utf8");
  const hints = [
    ...new Set(
      [
        ...text.matchAll(
          /(react-hook-form|zod|libphonenumber|date-fns|react-day-picker|embla|motion|vaul|cmdk|input-otp|radix|sonner|nuqs|lucide|zxcvbn|turnstile)/g,
        ),
      ].map((m) => m[1]),
    ),
  ].join(",");
  const names = [
    ...new Set([...text.matchAll(/\b([A-Z][a-z]+(?:[A-Z][a-z]+)+)\b/g)].map((m) => m[1])),
  ]
    .slice(0, 6)
    .join(",");
  rows.push([size, `${Math.round(size / 1024)}KB ${path.basename(pathname)} [${hints}] ${names}`]);
}
for (const [, line] of rows.sort((x, y) => y[0] - x[0])) console.log(line);
console.log(`extra on ${to}: ${Math.round(total / 1024)} KB gzip (level 6)`);
