// Lighthouse on the key public routes (issue 236): each route `runs` times on Lighthouse's mobile profile, the median
// run checked against apps/web/lighthouse.config.json. Prints a table (and adds it to the GitHub job summary), keeps
// the JSON and HTML reports, and fails when a median misses a budget.
//
//   node scripts/lighthouse-run.mjs                              starts `next start` on :3200 in apps/web (a build first)
//                                                                behind an HTTP/2 proxy, as production serves it
//   node scripts/lighthouse-run.mjs --base https://waafasworld.com --live   the live site, read-only (liveRoutes)
//   options: --runs 1, --only /shop, --out apps/web/lighthouse-report, --warn (report only, never fail)
import { spawn } from "node:child_process";
import { connect } from "node:net";
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const web = path.join(root, "apps", "web");
const config = JSON.parse(readFileSync(path.join(web, "lighthouse.config.json"), "utf8"));
const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : fallback;
};
const live = process.argv.includes("--live");
const warnOnly = process.argv.includes("--warn");
const local = !process.argv.includes("--base");
const base = arg("base", "https://localhost:3443");
const runs = Number(arg("runs", config.runs));
const out = path.resolve(arg("out", path.join(web, "lighthouse-report")));
const only = arg("only", null);
const routes = only ? [only] : live ? config.liveRoutes : config.routes;
mkdirSync(out, { recursive: true });

/** True when something listens on the local port. */
const portOpen = (port) =>
  new Promise((resolve) => {
    const socket = connect(port, "127.0.0.1");
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });

/** One shell argument on Windows (spawn uses a shell there); unchanged elsewhere. */
const quoteOnWindows = (arg) => (process.platform === "win32" ? `"${arg}"` : arg);

const run = (command, args, options = {}) =>
  new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
      ...options,
    });
    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk));
    child.stderr.on("data", (chunk) => (output += chunk));
    child.on("close", (code) => resolve({ code, output }));
  });

let server = null;
let proxy = null;
if (local) {
  server = spawn("pnpm", ["exec", "next", "start", "--port", "3200"], {
    cwd: web,
    stdio: "ignore",
    shell: process.platform === "win32",
  });
  // Production serves HTTP/2 through nginx: a self-signed certificate and a small proxy do the same here.
  const cert = path.join(out, "localhost-cert.pem");
  const key = path.join(out, "localhost-key.pem");
  await run("openssl", [
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-days",
    "2",
    "-subj",
    "/CN=localhost",
    "-keyout",
    key,
    "-out",
    cert,
  ]);
  proxy = spawn(
    process.execPath,
    [path.join(root, "scripts", "h2-proxy.mjs"), "3443", "3200", cert, key],
    { stdio: "ignore" },
  );
  // Wait for Next on plain HTTP, then for the proxy's port (no TLS check needed: Chrome gets --ignore-certificate-errors).
  const origin = "http://localhost:3200";
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const ok = await fetch(`${origin}/robots.txt`)
      .then((r) => r.ok)
      .catch(() => false);
    if (ok && (await portOpen(3443))) break;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  // Warm the server so the first run doesn't measure a cold render, nor the image optimizer's first encode of each
  // preloaded photo (seconds on a CI runner, issue 257): the page, then every width its LCP photo offers, asked for
  // with Chrome's Accept header so the same AVIF file is cached.
  for (const route of routes) {
    // codeql[js/file-access-to-http] The routes come from this repository's own config and only reach localhost.
    const html = await fetch(`${origin}${route}`)
      .then((response) => response.text())
      .catch(() => "");
    const sets = [...html.matchAll(/<link[^>]+rel="preload"[^>]+imageSrcSet="([^"]+)"/gi)].map(
      (m) => m[1],
    );
    const urls = sets.flatMap((set) =>
      set.split(",").map((candidate) => candidate.trim().split(" ")[0].replaceAll("&amp;", "&")),
    );
    for (const url of urls)
      // codeql[js/file-access-to-http] Image URLs from the local page above; localhost only.
      await fetch(new URL(url, origin), {
        headers: { accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8" },
      }).catch(() => undefined);
  }
}

const audit = (report, id) => report.audits[id]?.numericValue ?? 0;
const results = [];
for (const route of routes) {
  const name = route === "/" ? "home" : route.slice(1).replaceAll("/", "_");
  const reports = [];
  for (let index = 1; index <= runs; index += 1) {
    const file = path.join(out, `${name}-${index}`);
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      await run("npx", [
        "--yes",
        `lighthouse@${config.lighthouse}`,
        `${base}${route}`,
        "--output=json",
        "--output=html",
        `--output-path=${file}`,
        // Windows runs this through a shell, which would split the flags at the spaces and drop the certificate flag.
        quoteOnWindows(
          `--chrome-flags=--headless=new --no-sandbox${local ? " --ignore-certificate-errors" : ""}`,
        ),
        "--quiet",
      ]);
      try {
        const report = JSON.parse(readFileSync(`${file}.report.json`, "utf8"));
        if (!report.runtimeError) {
          reports.push(report);
          break;
        }
      } catch {
        // No report yet: try again.
      }
    }
  }
  if (reports.length === 0) {
    results.push({ route, failed: true });
    continue;
  }
  const score = (report, id) => Math.round((report.categories[id]?.score ?? 0) * 100);
  const sorted = [...reports].sort((a, b) => score(a, "performance") - score(b, "performance"));
  const median = sorted[Math.floor(sorted.length / 2)];
  results.push({
    route,
    runs: reports.map((report) => score(report, "performance")),
    performance: score(median, "performance"),
    accessibility: score(median, "accessibility"),
    "best-practices": score(median, "best-practices"),
    seo: score(median, "seo"),
    "largest-contentful-paint": audit(median, "largest-contentful-paint"),
    "cumulative-layout-shift": audit(median, "cumulative-layout-shift"),
    "total-blocking-time": audit(median, "total-blocking-time"),
  });
}
server?.kill();
proxy?.kill();

// `budgets` fail the run; `targets` (the NFR-PERF goals not yet met everywhere, D298) are reported as warnings.
const checks = [
  ...Object.entries(config.budgets).map(([key, limit]) => ({ key, limit, error: true })),
  ...Object.entries(config.targets ?? {}).map(([key, limit]) => ({ key, limit, error: false })),
];
const higherIsBetter = new Set(["performance", "accessibility", "best-practices", "seo"]);
const misses = [];
const warnings = [];
const lines = [
  `Lighthouse ${config.lighthouse}, mobile, ${base}, median of ${runs}`,
  "",
  "| Route | Performance (runs) | LCP | TBT | CLS | Accessibility | Best practices | SEO |",
  "| --- | --- | --- | --- | --- | --- | --- | --- |",
];
for (const result of results) {
  if (result.failed) {
    lines.push(`| ${result.route} | no result | | | | | | |`);
    misses.push(`${result.route}: no Lighthouse result`);
    continue;
  }
  for (const { key, limit, error } of checks) {
    const value = result[key];
    const missed = higherIsBetter.has(key) ? value < limit : value > limit;
    if (!missed) continue;
    const text = `${result.route} ${key} ${Number(value.toFixed(3))} ${higherIsBetter.has(key) ? "<" : ">"} ${limit}`;
    (error ? misses : warnings).push(text);
  }
  lines.push(
    `| ${result.route} | ${result.performance} (${result.runs.join("/")}) | ${(result["largest-contentful-paint"] / 1000).toFixed(1)} s | ${Math.round(result["total-blocking-time"])} ms | ${result["cumulative-layout-shift"].toFixed(2)} | ${result.accessibility} | ${result["best-practices"]} | ${result.seo} |`,
  );
}
if (warnings.length)
  lines.push("", "Below target (warning):", ...warnings.map((miss) => `- ${miss}`));
if (misses.length) lines.push("", "Over budget (fails):", ...misses.map((miss) => `- ${miss}`));
const text = `${lines.join("\n")}\n`;
process.stdout.write(text);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
process.exit(misses.length && !warnOnly ? 1 : 0);
