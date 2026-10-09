/**
 * Base Prettier options for every WAAFA package. The repo-root `prettier.config.mjs` adds the
 * Tailwind class-sorting plugin, which needs the path to the web app's stylesheet.
 * @type {import("prettier").Config}
 */
const config = {
  printWidth: 100,
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  arrowParens: "always",
  endOfLine: "lf",
};

export default config;
