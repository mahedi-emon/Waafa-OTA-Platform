#!/usr/bin/env node
/**
 * Repository guards (CLAUDE.md "Component rules" and "Never"). Run: `pnpm guards`. CI runs it on every PR.
 *
 * 1. One stylesheet: no .css file in apps/, packages/ or fixtures/ except apps/web/src/app/globals.css.
 * 2. The prototype is a reference, never source: nothing imports waafa.css or a .dc.html board.
 * 3. Colours come from tokens: no hex colour in apps/web/src outside app/globals.css and components/brand/.
 * 4. Raw HTML only through RichText (sanitised admin rich text) and JsonLd (structured data).
 * 5. Pages read data through the cached accessors: @waafa/fixtures is imported only inside src/lib/data/.
 * 6. One animation library: no framer-motion (Motion's "motion/react" only).
 * 7. Compliance: no Hajj, Umrah, manpower or recruitment copy in UI code, messages, fixtures or contracts
 *    (Phase F, after the licence). Comments and *.test.* files (which assert the absence) are skipped.
 * 8. Store name: never "Waafa Shop" in UI code, messages or fixtures.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".turbo",
  "dist",
  "build",
  "out",
  "coverage",
  "playwright-report",
  "test-results",
  "blob-report",
  ".lighthouseci",
]);
const CODE = /\.(?:ts|tsx|js|jsx|mjs|cjs)$/;

/** @param {string} dir @returns {string[]} repo-relative POSIX paths */
function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(join(root, dir));
  } catch {
    return out;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const rel = dir ? `${dir}/${name}` : name;
    const stats = statSync(join(root, rel));
    if (stats.isDirectory()) out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
}

const files = ["apps", "packages", "fixtures", "scripts"].flatMap((d) => walk(d));
/** @type {string[]} */
const failures = [];
const fail = (file, line, message) => failures.push(`${file}${line ? `:${line}` : ""}  ${message}`);
const read = (file) => readFileSync(join(root, file), "utf8");
const isComment = (line) => /^\s*(?:\/\/|\/?\*)/.test(line);
const isTest = (file) => /\.test\.[cm]?[jt]sx?$/.test(file) || file.includes("/e2e/");

// 1. One stylesheet
for (const file of files) {
  if (file.endsWith(".css") && file !== "apps/web/src/app/globals.css") {
    fail(
      file,
      0,
      "extra stylesheet: only apps/web/src/app/globals.css may exist (Tailwind utilities + tokens)",
    );
  }
}

for (const file of files.filter((f) => CODE.test(f) || f.endsWith(".css"))) {
  if (file === "scripts/guards.mjs") continue;
  const lines = read(file).split(/\r?\n/);
  const inWebSrc = file.startsWith("apps/web/src/");
  const brandOrTokens =
    file === "apps/web/src/app/globals.css" || file.startsWith("apps/web/src/components/brand/");
  const visibleSource =
    (inWebSrc ||
      file.startsWith("apps/web/messages/") ||
      file.startsWith("fixtures/src/") ||
      file.startsWith("packages/shared/src/")) &&
    !isTest(file);

  lines.forEach((text, index) => {
    const line = index + 1;
    // 2. Prototype imports
    if (/(?:import|require|@import)[^\n]*(?:waafa\.css|\.dc\.html)/.test(text)) {
      fail(
        file,
        line,
        "imports the prototype (waafa.css or a .dc.html board); rebuild it as components",
      );
    }
    // 3. Hex colours
    if (
      inWebSrc &&
      !brandOrTokens &&
      /(^|[^A-Za-z0-9_&/])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/.test(text)
    ) {
      fail(
        file,
        line,
        "hex colour outside app/globals.css and components/brand; use a token class",
      );
    }
    if (!CODE.test(file)) return;
    // 4. Raw HTML
    if (
      inWebSrc &&
      text.includes("dangerouslySetInnerHTML") &&
      !file.endsWith("/RichText.tsx") &&
      !file.endsWith("/JsonLd.tsx")
    ) {
      fail(file, line, "dangerouslySetInnerHTML outside RichText (sanitised) and JsonLd");
    }
    // 5. Fixtures only behind the data layer
    if (
      inWebSrc &&
      /from\s+["']@waafa\/fixtures/.test(text) &&
      !file.startsWith("apps/web/src/lib/data/")
    ) {
      fail(
        file,
        line,
        "imports @waafa/fixtures directly; read data through src/lib/data accessors",
      );
    }
    // 6. One animation library
    if (/from\s+["']framer-motion/.test(text)) {
      fail(file, line, "framer-motion import; use motion/react (LazyMotion + m.*)");
    }
    if (!visibleSource || isComment(text)) return;
    // 7. Compliance words
    if (/\b(?:hajj|umrah|manpower|recruitment)\b/i.test(text)) {
      fail(
        file,
        line,
        "Hajj/Umrah/manpower/recruitment copy is out of this build (Phase F, after the licence)",
      );
    }
    // 8. Store name
    if (/Waafa Shop/.test(text)) {
      fail(file, line, 'the store is "Waafas World", never "Waafa Shop"');
    }
  });
}

// Messages (JSON) get the compliance and store-name checks too.
for (const file of files.filter((f) => f.startsWith("apps/web/messages/") && f.endsWith(".json"))) {
  read(file)
    .split(/\r?\n/)
    .forEach((text, index) => {
      if (/\b(?:hajj|umrah|manpower|recruitment)\b/i.test(text)) {
        fail(
          file,
          index + 1,
          "Hajj/Umrah/manpower/recruitment copy is out of this build (Phase F)",
        );
      }
      if (/Waafa Shop/.test(text)) fail(file, index + 1, 'the store is "Waafas World"');
    });
}

if (failures.length > 0) {
  console.error(`guards: ${failures.length} problem${failures.length === 1 ? "" : "s"}\n`);
  for (const f of failures) console.error(`  ${f}`);
  console.error("\nSee CLAUDE.md (Component rules, Never) for why each rule exists.");
  process.exit(1);
}
console.log(`guards: ok (${files.length} files checked)`);
