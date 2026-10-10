import "dotenv/config";
import { defineConfig } from "prisma/config";

/** Prisma 7 config: the schema, migrations and the connection string (read from the environment). */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: { url: process.env.DATABASE_URL ?? "postgresql://waafa@localhost:5433/waafa" },
});
