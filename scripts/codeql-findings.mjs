// Reads the CodeQL results (SARIF) the analysis wrote, shows every finding as an annotation on its file and line, adds
// a table to the job summary, and fails when there is any error or warning. This is how CodeQL gates pull requests
// while the private repository has no GitHub code scanning to upload to (D205). A finding the code accepts on purpose
// carries `// codeql[<rule id>] <reason>` on the line above it (GitHub's comment convention); the reason is required
// and the summary lists it, so an accepted finding stays visible and reviewed (D214).
import { appendFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2] ?? "codeql-results";
const files = readdirSync(dir).filter((name) => name.endsWith(".sarif"));
if (files.length === 0) {
  console.error(`No SARIF results in ${dir}: the analysis did not finish.`);
  process.exit(1);
}

const findings = [];
for (const name of files) {
  const sarif = JSON.parse(readFileSync(join(dir, name), "utf8"));
  for (const run of sarif.runs ?? []) {
    const rules = new Map((run.tool?.driver?.rules ?? []).map((rule) => [rule.id, rule]));
    for (const result of run.results ?? []) {
      if ((result.suppressions ?? []).length > 0) continue;
      const rule = rules.get(result.ruleId);
      const where = result.locations?.[0]?.physicalLocation;
      findings.push({
        rule: result.ruleId ?? "unknown",
        level: result.level ?? rule?.defaultConfiguration?.level ?? "warning",
        message: result.message?.text ?? rule?.shortDescription?.text ?? result.ruleId ?? "",
        file: where?.artifactLocation?.uri ?? "",
        line: where?.region?.startLine ?? 1,
      });
    }
  }
}

const sources = new Map();
/** The reason on the `// codeql[rule, ...] reason` comment right above the finding, or null. */
function acceptedBecause(finding) {
  if (!finding.file || !existsSync(finding.file)) return null;
  if (!sources.has(finding.file))
    sources.set(finding.file, readFileSync(finding.file, "utf8").split(/\r?\n/));
  const above = sources.get(finding.file)[finding.line - 2] ?? "";
  const match = /^\s*\/\/\s*codeql\[([^\]]+)\]\s+(\S.*)$/.exec(above);
  if (!match) return null;
  const rules = match[1].split(",").map((rule) => rule.trim());
  return rules.includes(finding.rule) ? match[2].trim() : null;
}
for (const finding of findings) finding.accepted = acceptedBecause(finding);

/** A table cell of the job summary: backslashes first, then pipes, on one line. */
const cell = (text) =>
  String(text).replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\s+/g, " ");
/** Annotation text can't hold raw newlines or percent signs. */
const escape = (text) =>
  String(text).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
const blocking = findings.filter(
  (finding) => !finding.accepted && (finding.level === "error" || finding.level === "warning"),
);
const accepted = findings.filter((finding) => finding.accepted);
for (const finding of findings) {
  const kind = blocking.includes(finding) ? "error" : "notice";
  const text = finding.accepted
    ? `${finding.message} (accepted: ${finding.accepted})`
    : finding.message;
  console.log(
    `::${kind} file=${finding.file},line=${finding.line},title=CodeQL ${finding.rule}::${escape(text)}`,
  );
}

const summary = process.env.GITHUB_STEP_SUMMARY;
if (summary) {
  const rows = findings.map(
    (finding) =>
      `| ${cell(finding.level)} | ${cell(finding.rule)} | ${cell(`${finding.file}:${finding.line}`)} | ${cell(finding.message)} | ${cell(finding.accepted ?? "")} |`,
  );
  appendFileSync(
    summary,
    findings.length === 0
      ? "### CodeQL: no findings\n"
      : `### CodeQL: ${findings.length} finding(s), ${blocking.length} blocking, ${accepted.length} accepted\n\n| Level | Rule | Where | Message | Accepted because |\n| --- | --- | --- | --- | --- |\n${rows.join("\n")}\n`,
  );
}

console.log(
  findings.length === 0
    ? "CodeQL: no findings."
    : `CodeQL: ${findings.length} finding(s), ${blocking.length} blocking, ${accepted.length} accepted.`,
);
process.exit(blocking.length === 0 ? 0 : 1);
