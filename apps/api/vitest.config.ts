import { defineConfig } from "vitest/config";

/** API tests: one fork at a time (they share one test database), migrations applied once in globalSetup. */
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts", "src/**/*.test.ts"],
    globalSetup: ["test/globalSetup.ts"],
    pool: "forks",
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
