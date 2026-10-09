import base from "@waafa/config/prettier";

/** @type {import("prettier").Config} */
const config = {
  ...base,
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindStylesheet: "./apps/web/src/app/globals.css",
  tailwindFunctions: ["cn", "cva"],
};

export default config;
