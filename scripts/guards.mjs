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
 * 8. Store name (issue 302): "Waafa’s World" with the typographic apostrophe. Never "Waafa Shop", never the former
 *    "Waafas World" (only lib/seo/schemaNames.ts keeps it, as the structured data alternateName) and never a plain
 *    apostrophe in visible copy (schemaName() writes that one for structured data). The fixtures' store name must be
 *    the new one.
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
/** Issue 302: what is wrong with how a line names the store, or null. */
const SCHEMA_NAMES = "apps/web/src/lib/seo/schemaNames.ts";
function storeNameProblem(file, text) {
  if (/Waafa Shop/.test(text)) return 'the store is "Waafa’s World", never "Waafa Shop"';
  if (file === SCHEMA_NAMES) return null;
  if (/Waafas World/.test(text)) {
    return 'the store is now "Waafa’s World"; the former name lives only in lib/seo/schemaNames.ts';
  }
  if (/Waafa's World/.test(text))
    return 'write "Waafa’s World" with the typographic apostrophe (’)';
  return null;
}

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
    const storeName = storeNameProblem(file, text);
    if (storeName) fail(file, line, storeName);
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
      const storeName = storeNameProblem(file, text);
      if (storeName) fail(file, index + 1, storeName);
    });
}

// 8. The store's own name in the fixtures is the new one (issue 302).
if (!read("fixtures/src/settings.ts").includes('storeName: "Waafa’s World"')) {
  fail("fixtures/src/settings.ts", 0, 'siteSettings.storeName must be "Waafa’s World"');
}

// The image-only server bundle (issue 164) must pass every setting the repository's compose file passes.
{
  const settings = (file) =>
    new Set(
      read(file)
        .match(/\$\{[A-Z_]+/g)
        ?.map((m) => m.slice(2)) ?? [],
    );
  const server = settings("deploy/server/compose.yml");
  // Build arguments only: they are baked into the images the bundle pulls.
  const buildOnly = new Set(["TURNSTILE_SITE_KEY", "GIT_REVISION"]);
  for (const name of settings("deploy/compose.yml")) {
    if (!server.has(name) && !buildOnly.has(name))
      fail("deploy/server/compose.yml", 0, `missing \${${name}} (deploy/compose.yml passes it)`);
  }
}

// Issue 333: the release's deploy steps run on the server in /opt/waafa, so every script they name must ship in the
// server bundle (deploy/server); deploy/check.sh, for one, is the repository-layout preflight.
{
  const release = read("docs/RELEASE.md");
  const start = release.indexOf("## Deploy steps");
  const end = release.indexOf("\n## ", start + 1);
  const steps = start < 0 ? "" : release.slice(start, end < 0 ? undefined : end);
  if (start < 0) fail("docs/RELEASE.md", 0, `no "## Deploy steps" section`);
  const shipped = new Set(readdirSync(join(root, "deploy/server")));
  for (const [, script] of steps.matchAll(/\bsh ([\w.-]+\.sh)\b/g)) {
    if (!shipped.has(script))
      fail("docs/RELEASE.md", 0, `deploy steps run ${script}, which deploy/server does not ship`);
  }
}

if (failures.length > 0) {
  console.error(`guards: ${failures.length} problem${failures.length === 1 ? "" : "s"}\n`);
  for (const f of failures) console.error(`  ${f}`);
  console.error("\nSee CLAUDE.md (Component rules, Never) for why each rule exists.");
  process.exit(1);
}
console.log(`guards: ok (${files.length} files checked)`);
