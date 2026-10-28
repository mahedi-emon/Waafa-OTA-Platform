// Compiles the API for the production image (issues 231 and 303): the API, the job worker, the seed, the migration
// runner and the off-site copy become JavaScript files in dist/, so the image ships no TypeScript source and no tests.
// Everything is bundled in, npm dependencies included (the Prisma client and its query compiler too), except the
// RUNTIME packages below: native addons and packages that read their own files at run time. scripts/
// collect-runtime.mjs copies just those, with their dependencies, next to dist/. esbuild reads the tsconfig
// (experimentalDecorators, no decorator metadata: providers use explicit @Inject, D126), the same way tsx runs the
// API in development, so the bundle behaves like `tsx src/main.ts`.
import { rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/** Installed beside dist/ in the image (collect-runtime.mjs reads this list from dist/runtime.json). */
const RUNTIME = [
  "sharp", // native image library (libvips)
  "argon2", // native password hashing
  "pdfkit", // reads its font metrics from its own folder
  "bullmq", // ships Lua scripts it loads by path
  "ioredis", // shared with bullmq, so both see one client class
];

/**
 * Optional peers Nest and Fastify try to load inside try/catch; none is installed. Left as plain require() calls,
 * they fail at run time exactly as they do without a bundle.
 */
const OPTIONAL = [
  "@nestjs/microservices",
  "@nestjs/microservices/*",
  "@nestjs/websockets",
  "@nestjs/websockets/*",
  "@nestjs/platform-express",
  "class-transformer",
  "class-transformer/*",
  "class-validator",
  "@fastify/static",
  "@fastify/view",
  "@as-integrations/fastify",
  "@fastify/multipart",
];

await rm(path.join(root, "dist"), { recursive: true, force: true });

const result = await build({
  absWorkingDir: root,
  entryPoints: {
    main: "src/main.ts",
    worker: "src/worker.ts",
    seed: "prisma/seed.ts",
    offsite: "src/offsite.ts",
    migrate: "src/migrate.ts",
  },
  outdir: "dist",
  bundle: true,
  // Shared code (Nest, Prisma, the schemas) lands once in a chunk instead of in every entry.
  splitting: true,
  chunkNames: "chunks/[name]-[hash]",
  platform: "node",
  format: "esm",
  target: "node22",
  external: [...RUNTIME.flatMap((name) => [name, `${name}/*`]), ...OPTIONAL],
  // Nest names providers and loggers after their classes: keep the names readable.
  minify: false,
  keepNames: true,
  // No source maps: a map would carry the TypeScript source back into the image.
  sourcemap: false,
  // Bundled CommonJS code may call require() and read __dirname; give ESM output both.
  banner: {
    js: [
      "import { createRequire as __createRequire } from 'node:module';",
      "import { fileURLToPath as __fileURLToPath } from 'node:url';",
      "import { dirname as __pathDirname } from 'node:path';",
      "const require = __createRequire(import.meta.url);",
      "const __filename = __fileURLToPath(import.meta.url);",
      "const __dirname = __pathDirname(__filename);",
    ].join(" "),
  },
  logLevel: "info",
  metafile: true,
});

await writeFile(path.join(root, "dist", "runtime.json"), JSON.stringify(RUNTIME));
const bytes = Object.values(result.metafile.outputs).reduce((sum, output) => sum + output.bytes, 0);
console.warn(`API compiled to dist/ (${Math.round(bytes / 1024)} KB)`);
