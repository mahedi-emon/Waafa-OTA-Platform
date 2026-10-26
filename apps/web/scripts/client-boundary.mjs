/* eslint-disable no-console -- a command-line tool that prints its report */
// Guard (issue 236): Server-only modules must never end up inside a Client Component's import graph. LocalLink is an
// async Server Component (it awaits getLocale); next-intl/server and server-only throw in the browser. A file without
// "use client" that a client file imports runs on the client too, so this walks every client file's imports (Server
// Actions excepted).
//   node scripts/client-boundary.mjs        exit 1 and list the chains that reach a server-only module
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(web, "src");

/** Imports that only work on the server. */
const SERVER_ONLY = [
  /^@\/components\/nav\/LocalLink$/,
  /^next-intl\/server$/,
  /^server-only$/,
  /^next\/headers$/,
];

function sourceFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

function resolve(from, spec) {
  let base;
  if (spec.startsWith("@/")) base = path.join(src, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else return null;
  for (const candidate of [base, `${base}.tsx`, `${base}.ts`, path.join(base, "index.ts")]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/** Server Actions ("use server") are called over the network from the client, so their imports stay on the server. */
const isServerAction = (file) => /^\s*["']use server["']/.test(readFileSync(file, "utf8"));

const importRe = /^(?:import|export)\s+(?!type\b)(?:[^"';]*?\sfrom\s+)?["']([^"']+)["']/gm;
const cache = new Map();
function imports(file) {
  if (!cache.has(file)) {
    const code = readFileSync(file, "utf8");
    cache.set(
      file,
      [...code.matchAll(importRe)].map((m) => m[1]),
    );
  }
  return cache.get(file);
}

const problems = [];
for (const file of sourceFiles(src)) {
  if (!readFileSync(file, "utf8").startsWith('"use client"')) continue;
  const seen = new Set();
  const walk = (current, chain) => {
    for (const spec of imports(current)) {
      if (SERVER_ONLY.some((re) => re.test(spec))) {
        problems.push([...chain, spec].map((p) => path.relative(web, p)).join(" -> "));
        continue;
      }
      const next = resolve(current, spec);
      if (!next || seen.has(next) || isServerAction(next)) continue;
      seen.add(next);
      walk(next, [...chain, next]);
    }
  };
  walk(file, [file]);
}

const unique = [...new Set(problems)];
if (unique.length) {
  console.error(
    `client boundary: ${unique.length} client import chain(s) reach a server-only module:`,
  );
  for (const line of unique) console.error(`  ${line}`);
  process.exit(1);
}
console.log("client boundary: ok");
