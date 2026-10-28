import { createHash, randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";

/** The lock `prisma migrate deploy` takes, so the two never run side by side. */
const PRISMA_MIGRATE_LOCK = 72707369;

/** Prisma's own bookkeeping table, created exactly as `prisma migrate deploy` creates it on PostgreSQL. */
const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id" VARCHAR(36) PRIMARY KEY NOT NULL,
  "checksum" VARCHAR(64) NOT NULL,
  "finished_at" TIMESTAMPTZ,
  "migration_name" VARCHAR(255) NOT NULL,
  "logs" TEXT,
  "rolled_back_at" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0
)`;

export type MigrationResult = { applied: string[]; pending: number; changedChecksums: string[] };

/** SHA-256 of migration.sql in hex: the checksum Prisma stores. */
export function migrationChecksum(sql: string): string {
  return createHash("sha256").update(sql).digest("hex");
}

/** The migration folders that hold a migration.sql, oldest first (Prisma names them by timestamp). */
async function localMigrations(dir: string): Promise<Array<{ name: string; sql: string }>> {
  const entries = await readdir(dir, { withFileTypes: true });
  const names = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const out: Array<{ name: string; sql: string }> = [];
  for (const name of names) {
    try {
      out.push({ name, sql: await readFile(join(dir, name, "migration.sql"), "utf8") });
    } catch {
      // A folder without migration.sql is not a migration (Prisma skips it too).
    }
  }
  return out;
}

/**
 * Applies the Prisma migrations in `dir` with plain pg (issue 303), so the production image needs neither the Prisma
 * CLI nor its schema engine. It keeps `prisma migrate deploy`'s contract: the same `_prisma_migrations` table and
 * advisory lock, SHA-256 checksums, oldest first, and a migration that failed earlier stops the deploy (Prisma's
 * P3009) until someone resolves it. Each migration runs in one transaction, so a failure leaves nothing half done.
 */
export async function applyMigrations(
  databaseUrl: string,
  dir: string,
  log: (line: string) => void = () => {},
): Promise<MigrationResult> {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(CREATE_TABLE);
    await client.query("SELECT pg_advisory_lock($1)", [PRISMA_MIGRATE_LOCK]);
    try {
      const { rows } = await client.query<{
        migration_name: string;
        checksum: string;
        finished_at: Date | null;
        rolled_back_at: Date | null;
      }>(`SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations"`);
      const failed = rows.filter((row) => !row.finished_at && !row.rolled_back_at);
      if (failed.length > 0) {
        throw new Error(
          `Migration ${failed[0]!.migration_name} failed earlier and was never resolved. Restore the backup taken ` +
            "before this deploy, or mark it rolled back, then deploy again (Prisma P3009).",
        );
      }
      const done = new Map(
        rows
          .filter((row) => row.finished_at && !row.rolled_back_at)
          .map((row) => [row.migration_name, row.checksum]),
      );
      const local = await localMigrations(dir);
      const changedChecksums = local
        .filter((m) => done.has(m.name) && done.get(m.name) !== migrationChecksum(m.sql))
        .map((m) => m.name);
      for (const name of changedChecksums) {
        log(`warning: ${name} changed after it was applied; it is not run again`);
      }
      const pending = local.filter((m) => !done.has(m.name));
      const applied: string[] = [];
      for (const migration of pending) {
        const id = randomUUID();
        await client.query("BEGIN");
        try {
          await client.query(
            `INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at, applied_steps_count)
             VALUES ($1, $2, $3, now(), 0)`,
            [id, migrationChecksum(migration.sql), migration.name],
          );
          await client.query(migration.sql);
          await client.query(
            `UPDATE "_prisma_migrations" SET finished_at = now(), applied_steps_count = 1 WHERE id = $1`,
            [id],
          );
          await client.query("COMMIT");
        } catch (error) {
          await client.query("ROLLBACK");
          throw new Error(
            `Migration ${migration.name} failed and was rolled back: ${(error as Error).message}`,
          );
        }
        applied.push(migration.name);
        log(`applied ${migration.name}`);
      }
      log(
        applied.length === 0
          ? `No pending migrations (${local.length} applied).`
          : `${applied.length} migration${applied.length === 1 ? "" : "s"} applied.`,
      );
      return { applied, pending: pending.length, changedChecksums };
    } finally {
      await client.query("SELECT pg_advisory_unlock($1)", [PRISMA_MIGRATE_LOCK]);
    }
  } finally {
    await client.end();
  }
}
