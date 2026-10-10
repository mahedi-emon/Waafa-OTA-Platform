import base from "@waafa/config/eslint/base";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([...base, globalIgnores(["src/generated/**"])]);
