import { execSync } from "node:child_process";
import pg from "pg";

/** The database the API tests use: API_TEST_DATABASE_URL (CI service), else the local cluster from the README. */
export const TEST_DATABASE_URL =
  process.env.API_TEST_DATABASE_URL ?? "postgresql://waafa@localhost:5433/waafa_test";

/**
 * Applies the migrations to the test database once. When no database is reachable (a laptop without PostgreSQL),
 * the database tests are skipped with a warning instead of failing; CI always has one.
 */
export default async function setup() {
  const client = new pg.Client({
    connectionString: TEST_DATABASE_URL,
    connectionTimeoutMillis: 3_000,
  });
  try {
    await client.connect();
    await client.end();
  } catch {
    if (process.env.CI) throw new Error(`Test database not reachable at ${TEST_DATABASE_URL}`);
    console.warn(`API database tests skipped: no PostgreSQL at ${TEST_DATABASE_URL}`);
    process.env.API_TEST_DB = "off";
    return;
  }
  execSync("npx prisma migrate deploy", {
    stdio: "ignore",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
  process.env.API_TEST_DB = "on";
}
