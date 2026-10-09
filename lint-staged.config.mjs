/**
 * Pre-commit: format staged files and run the repository guards once (fast, whole repo).
 * Lint, typecheck, tests and build run in CI and before every PR (CLAUDE.md quality gates).
 * @type {import("lint-staged").Configuration}
 */
const config = {
  "*.{ts,tsx,js,mjs,cjs,json,css,yml,yaml}": "prettier --write --ignore-unknown",
  "*": () => "node scripts/guards.mjs",
};

export default config;
