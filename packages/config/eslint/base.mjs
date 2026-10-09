import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

/** Rules every WAAFA package shares: strict TypeScript, no `any`, type-only imports. */
export const sharedRules = {
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
  "@typescript-eslint/no-unused-vars": [
    "error",
    { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
  ],
  "no-console": ["warn", { allow: ["warn", "error"] }],
};

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node } },
    rules: sharedRules,
  },
  globalIgnores(["dist/**", "coverage/**", ".turbo/**"]),
]);
