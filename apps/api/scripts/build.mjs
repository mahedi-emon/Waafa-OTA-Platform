// Compiles the API for the production image (issue 231): the API, the job worker and the seed become three
// JavaScript files in dist/, so the image ships no TypeScript source and no tests.
// The workspace packages (@waafa/shared, @waafa/fixtures) export TypeScript, so they are bundled in; every npm
// dependency of the API stays external and comes from the production install next to dist/. esbuild reads the
// tsconfig (experimentalDecorators, no decorator metadata: providers use explicit @Inject, D126), the same way tsx
// runs the API in development, so the bundle behaves like `tsx src/main.ts`.
import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const external = Object.keys(pkg.dependencies ?? {}).filter((name) => !name.startsWith("@waafa/"));

await rm(path.join(root, "dist"), { recursive: true, force: true });

const result = await build({
  absWorkingDir: root,
  entryPoints: {
    main: "src/main.ts",
    worker: "src/worker.ts",
    seed: "prisma/seed.ts",
    offsite: "src/offsite.ts",
  },
  outdir: "dist",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  // Subpath imports (e.g. @prisma/client/runtime/client) stay external with their package.
  external: external.flatMap((name) => [name, `${name}/*`]),
  // Nest names providers and loggers after their classes: keep the names readable.
  minify: false,
  keepNames: true,
  // No source maps: a map would carry the TypeScript source back into the image.
  sourcemap: false,
  // Bundled CommonJS code may call require(); give ESM output one.
  banner: {
    js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
  },
  logLevel: "info",
  metafile: true,
});

const bytes = Object.values(result.metafile.outputs).reduce((sum, output) => sum + output.bytes, 0);
console.warn(`API compiled to dist/ (${Math.round(bytes / 1024)} KB)`);
