// Billed GitHub Actions minutes for one pull request (issue 231), for the CI budget column in docs/TRACKER.md.
//   node scripts/ci-minutes.mjs <pr-number>
// Counts every workflow run on the PR's branch (pull_request and labelled re-runs). Each job is billed in whole
// minutes, rounded up, so the sum is per job. Needs the GitHub CLI (`gh`) signed in.
import { execFileSync } from "node:child_process";

const pr = process.argv[2];
if (!/^\d+$/.test(pr ?? "")) {
  console.error("Usage: node scripts/ci-minutes.mjs <pr-number>");
  process.exit(1);
}

const gh = (...args) =>
  JSON.parse(execFileSync("gh", args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }));
const { headRefName } = gh("pr", "view", pr, "--json", "headRefName");
const runs = gh(
  "run",
  "list",
  "--branch",
  headRefName,
  "--limit",
  "100",
  "--json",
  "databaseId,workflowName,event,status,attempt",
);

let total = 0;
const perWorkflow = new Map();
for (const run of runs) {
  if (run.status !== "completed") continue;
  const attempts = Math.max(1, run.attempt ?? 1);
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const { jobs } = gh(
      "api",
      `repos/{owner}/{repo}/actions/runs/${run.databaseId}/attempts/${attempt}/jobs?per_page=100`,
    );
    for (const job of jobs) {
      if (!job.started_at || !job.completed_at || job.conclusion === "skipped") continue;
      const ms = Date.parse(job.completed_at) - Date.parse(job.started_at);
      if (ms <= 0) continue;
      const minutes = Math.ceil(ms / 60_000);
      total += minutes;
      perWorkflow.set(run.workflowName, (perWorkflow.get(run.workflowName) ?? 0) + minutes);
    }
  }
}

for (const [name, minutes] of perWorkflow) console.log(`${name}: ${minutes} min`);
console.log(`PR #${pr} (${headRefName}): ${total} billed minutes`);
