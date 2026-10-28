import { execSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrations } from "../src/migrations/applyMigrations";
import { dbAvailable, TEST_DATABASE_URL } from "./helpers";

const MIGRATIONS = resolve(__dirname, "../prisma/migrations");
const FRESH_DB = `waafa_migrate_${process.pid}`;

/** The test server's URL pointed at another database. */
function urlFor(database: string): string {
  const url = new URL(TEST_DATABASE_URL);
  url.pathname = `/${database}`;
  return url.toString();
}

async function admin<T>(run: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = new pg.Client({ connectionString: urlFor("postgres") });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

describe.skipIf(!dbAvailable)("applyMigrations (issue 303)", () => {
  beforeAll(async () => {
    await admin((client) => client.query(`CREATE DATABASE ${FRESH_DB}`));
  });

  afterAll(async () => {
    await admin((client) => client.query(`DROP DATABASE IF EXISTS ${FRESH_DB} WITH (FORCE)`));
  });

  it("finds nothing to do on a database Prisma migrated, with the same checksums", async () => {
    const result = await applyMigrations(TEST_DATABASE_URL, MIGRATIONS);
    expect(result.applied).toEqual([]);
    // A local database may hold a migration edited after it ran; the first one never changes.
    expect(result.changedChecksums).not.toContain("20261010150157_init");
  });

  it("migrates an empty database so that Prisma sees it as up to date", async () => {
    const lines: string[] = [];
    const first = await applyMigrations(urlFor(FRESH_DB), MIGRATIONS, (line) => lines.push(line));
    expect(first.applied.length).toBeGreaterThan(10);
    expect(lines.at(-1)).toMatch(/migrations applied/);
    const status = execSync("npx prisma migrate status", {
      cwd: resolve(__dirname, ".."),
      env: { ...process.env, DATABASE_URL: urlFor(FRESH_DB) },
      encoding: "utf8",
    });
    expect(status).toContain("Database schema is up to date");
    expect((await applyMigrations(urlFor(FRESH_DB), MIGRATIONS)).applied).toEqual([]);
  }, 120_000);

  it("rolls a failing migration back, records nothing and stops before the next one", async () => {
    const dir = mkdtempSync(join(tmpdir(), "waafa-migrations-"));
    try {
      cpSync(MIGRATIONS, dir, { recursive: true });
      for (const [name, sql] of [
        ["29990101000000_broken", 'CREATE TABLE "TmpOk" (id INT);\nSELECT * FROM "NoSuchTable";'],
        ["29990102000000_after", 'CREATE TABLE "TmpAfter" (id INT);'],
      ] as const) {
        mkdirSync(join(dir, name));
        writeFileSync(join(dir, name, "migration.sql"), sql);
      }
      await expect(applyMigrations(urlFor(FRESH_DB), dir)).rejects.toThrow(
        /29990101000000_broken failed and was rolled back/,
      );
      const client = new pg.Client({ connectionString: urlFor(FRESH_DB) });
      await client.connect();
      const rows = await client.query(
        `SELECT 1 FROM "_prisma_migrations" WHERE migration_name LIKE '2999%'`,
      );
      const tables = await client.query(
        `SELECT 1 FROM information_schema.tables WHERE table_name IN ('TmpOk', 'TmpAfter')`,
      );
      await client.end();
      expect(rows.rowCount).toBe(0);
      expect(tables.rowCount).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("refuses to continue after a migration Prisma left failed", async () => {
    const client = new pg.Client({ connectionString: urlFor(FRESH_DB) });
    await client.connect();
    await client.query(
      `INSERT INTO "_prisma_migrations" (id, checksum, migration_name) VALUES ('x-failed', 'abc', '29990103000000_half')`,
    );
    await client.end();
    await expect(applyMigrations(urlFor(FRESH_DB), MIGRATIONS)).rejects.toThrow(/P3009/);
  });
});
