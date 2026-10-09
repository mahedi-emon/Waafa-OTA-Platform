// Installs the git hooks after `pnpm install`, except in CI and production installs (husky docs).
if (
  process.env.CI === "true" ||
  process.env.NODE_ENV === "production" ||
  process.env.HUSKY === "0"
) {
  process.exit(0);
}
const husky = (await import("husky")).default;
const message = husky();
if (message) console.log(message);
