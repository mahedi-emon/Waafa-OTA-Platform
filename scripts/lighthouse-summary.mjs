// Prints the Lighthouse CI scores per route as a Markdown table and adds it to the GitHub job summary (#22).
// With several runs per route it shows the representative (median) run and every run's performance (issue 236).
// Usage: node scripts/lighthouse-summary.mjs <lhci filesystem output dir>
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2] ?? "lhci-report";
const manifest = join(dir, "manifest.json");
if (!existsSync(manifest)) {
  console.log(`No Lighthouse manifest in ${dir}`);
  process.exit(0);
}

const rows = JSON.parse(readFileSync(manifest, "utf8"));
const percent = (value) => Math.round((value ?? 0) * 100);
const byRoute = new Map();
for (const row of rows) {
  const route = new URL(row.url).pathname;
  const entry = byRoute.get(route) ?? { runs: [], median: null };
  entry.runs.push(percent(row.summary?.performance));
  if (row.isRepresentativeRun || !entry.median) entry.median = row;
  byRoute.set(route, entry);
}
const metrics = (row) => {
  try {
    const report = JSON.parse(readFileSync(row.jsonPath, "utf8"));
    const audit = (id) => report.audits[id]?.numericValue ?? 0;
    return `${(audit("largest-contentful-paint") / 1000).toFixed(1)} s | ${Math.round(audit("total-blocking-time"))} ms | ${audit("cumulative-layout-shift").toFixed(2)}`;
  } catch {
    return "- | - | -";
  }
};
const lines = [
  "| Route | Performance (runs) | LCP | TBT | CLS | Accessibility | Best practices | SEO |",
  "| --- | --- | --- | --- | --- | --- | --- | --- |",
  ...[...byRoute.entries()].map(([route, { runs, median }]) => {
    const scores = median.summary ?? {};
    return `| ${route} | ${percent(scores.performance)} (${runs.join("/")}) | ${metrics(median)} | ${percent(scores.accessibility)} | ${percent(scores["best-practices"])} | ${percent(scores.seo)} |`;
  }),
];
const table = `${lines.join("\n")}\n`;
console.log(table);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, table);
