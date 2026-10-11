// Prints the Lighthouse CI scores per route as a Markdown table and adds it to the GitHub job summary (#22).
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
const lines = [
  "| Route | Performance | Accessibility | Best practices | SEO |",
  "| --- | --- | --- | --- | --- |",
  ...rows.map((row) => {
    const scores = row.summary ?? {};
    return `| ${new URL(row.url).pathname} | ${percent(scores.performance)} | ${percent(scores.accessibility)} | ${percent(scores["best-practices"])} | ${percent(scores.seo)} |`;
  }),
];
const table = `${lines.join("\n")}\n`;
console.log(table);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, table);
