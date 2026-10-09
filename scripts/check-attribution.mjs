#!/usr/bin/env node
/**
 * Authorship guard: the owner is the only author, with no co-author trailer and no AI attribution
 * (CLAUDE.md, Git). Used by the husky commit-msg hook and by CI on every pull request.
 *
 *   node scripts/check-attribution.mjs <commit-msg-file>          husky commit-msg
 *   node scripts/check-attribution.mjs --range <base>..<head>       CI: every commit of the PR (message + author)
 *   node scripts/check-attribution.mjs --text "<title and body>"    CI: the PR title and body
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const FORBIDDEN = /co-authored-by|generated with|claude-session|noreply@anthropic/i;
const OWNER_EMAILS = new Set([
  "mahedi.emon62@gmail.com",
  "113725370+mahedi-emon@users.noreply.github.com",
]);
const BOT_AUTHORS = /\[bot\]@users\.noreply\.github\.com$/;

/** @param {string} label @param {string} text */
function checkText(label, text) {
  const hit = text.split(/\r?\n/).find((line) => FORBIDDEN.test(line));
  if (hit) {
    console.error(`attribution: ${label} contains a forbidden line:\n  ${hit.trim()}`);
    console.error("Remove co-author trailers and AI attribution; the owner is the only author.");
    process.exit(1);
  }
}

const [mode, value] = process.argv.slice(2);

if (mode === "--range") {
  const log = execFileSync("git", ["log", "--format=%H%x1f%ae%x1f%B%x1e", value], {
    encoding: "utf8",
  });
  const commits = log
    .split("\x1e")
    .map((c) => c.trim())
    .filter(Boolean);
  for (const commit of commits) {
    const [sha = "", email = "", body = ""] = commit.split("\x1f");
    checkText(`commit ${sha.slice(0, 7)}`, body);
    if (!OWNER_EMAILS.has(email) && !BOT_AUTHORS.test(email)) {
      console.error(
        `attribution: commit ${sha.slice(0, 7)} is authored by ${email}, not the owner.`,
      );
      process.exit(1);
    }
  }
  console.log(`attribution: ${commits.length} commit(s) ok`);
} else if (mode === "--text") {
  checkText("pull request title or body", value ?? "");
  console.log("attribution: pull request text ok");
} else if (mode) {
  // husky commit-msg: the first argument is the message file; ignore git's comment lines.
  const message = readFileSync(mode, "utf8")
    .split(/\r?\n/)
    .filter((line) => !line.startsWith("#"))
    .join("\n");
  checkText("commit message", message);
} else {
  console.error("usage: check-attribution.mjs <msg-file> | --range <base>..<head> | --text <text>");
  process.exit(2);
}
