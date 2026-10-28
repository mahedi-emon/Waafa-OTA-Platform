// Copies the packages the compiled API still loads from disk (dist/runtime.json, written by build.mjs) and everything
// they depend on into <out>/node_modules, as plain folders (issue 303). The image then needs no package manager, no
// lockfile install and none of the packages already bundled into dist/. Run after build.mjs:
//   node scripts/collect-runtime.mjs /out
// A dependency that two packages need in different versions goes into the dependent's own node_modules, which is
// where Node looks first.
import { cp, readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.resolve(process.argv[2] ?? "runtime");
const runtime = JSON.parse(await readFile(path.join(root, "dist", "runtime.json"), "utf8"));

/** Files no running program reads. */
const SKIP =
  /(\.d\.[cm]?ts|\.map|\.md|\.markdown|LICENSE\.txt\.bak|\.tsbuildinfo)$|[/\\](test|tests|__tests__|docs|example|examples|\.github)[/\\]?$/i;

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

/** The real folder of `name` as seen from `fromDir` (pnpm links each dependency beside its dependent). */
async function locate(name, fromDir) {
  let dir = fromDir;
  for (;;) {
    const candidate = path.join(dir, "node_modules", name);
    if (await exists(path.join(candidate, "package.json"))) return realpath(candidate);
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** Where each package name went at the top level, and its version there. */
const top = new Map();
let copied = 0;

async function copyPackage(name, fromDir, targetModules) {
  const source = await locate(name, fromDir);
  if (!source) return; // an optional dependency for another platform
  const pkg = JSON.parse(await readFile(path.join(source, "package.json"), "utf8"));
  let target = path.join(out, "node_modules", name);
  const seen = top.get(name);
  if (seen) {
    if (seen === pkg.version) return;
    target = path.join(targetModules, name);
    if (await exists(target)) return;
  } else {
    top.set(name, pkg.version);
  }
  await cp(source, target, {
    recursive: true,
    dereference: true,
    filter: (file) => {
      const inside = path.relative(source, file);
      return !SKIP.test(inside) && !inside.split(path.sep).includes("node_modules");
    },
  });
  copied += 1;
  const deps = { ...pkg.dependencies, ...pkg.optionalDependencies };
  for (const dep of Object.keys(deps)) {
    // pnpm keeps a package's own dependencies beside it; the upward search finds them first.
    await copyPackage(dep, path.dirname(source), path.join(target, "node_modules"));
  }
}

for (const name of runtime) await copyPackage(name, root, path.join(out, "node_modules"));
console.warn(`runtime packages: ${copied} copied to ${path.join(out, "node_modules")}`);
