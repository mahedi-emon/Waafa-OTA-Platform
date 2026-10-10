import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { loadFixtures } from "@waafa/fixtures";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedDatabase } from "../src/seed/seedDatabase";

/**
 * `pnpm --filter @waafa/api seed`: loads the Sample content (every record marked Sample until the team replaces it in
 * Admin) and the first Super Admin from SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD. Safe to run on every deploy.
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  try {
    const result = await seedDatabase(prisma, loadFixtures(), {
      ...(email && password ? { admin: { email, password } } : {}),
    });
    console.warn(
      `Seed done: ${result.settings} settings, ${result.documents} records added${
        result.adminCreated ? ", first Super Admin created" : ""
      }.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
