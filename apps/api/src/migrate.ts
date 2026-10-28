import { resolve } from "node:path";
import "dotenv/config";
import { applyMigrations } from "./migrations/applyMigrations";

/**
 * `node dist/migrate.js` (issue 303): applies the pending database migrations before the API starts, in place of
 * `prisma migrate deploy`, so the image carries no Prisma CLI. MIGRATIONS_DIR defaults to prisma/migrations.
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const dir = resolve(process.env.MIGRATIONS_DIR ?? "prisma/migrations");
  await applyMigrations(url, dir, (line) => console.warn(`migrate: ${line}`));
}

main().catch((error: unknown) => {
  console.error(`migrate: ${(error as Error).message}`);
  process.exit(1);
});
