import "server-only";
import { apiConfig } from "./api/apiClient";
import { createApiRepositories } from "./api/apiRepositories";
import { createFixtureRepositories } from "./fixtures/createFixtureRepositories";
import type { Repositories } from "./types";

/*
 * Next.js bundles route handlers and pages as separate module graphs, so a plain module-level instance would be two
 * different in-memory stores (an order placed through /api/orders would be invisible to /shop/track). Fixture mode
 * keeps the one store on globalThis; API mode has no local state.
 */
const globalStore = globalThis as typeof globalThis & { __waafaRepositories?: Repositories };

/** True when the site runs on the API (WAAFA_API_URL and WAAFA_INTAKE_KEY set), false on the Sample fixtures. */
export const apiMode = apiConfig() !== null;

/**
 * The data source behind every accessor in this folder: the API snapshot in API mode (Phase C, D136), the typed
 * Sample fixtures otherwise. No page or component changes between the two.
 */
export const repositories: Repositories = apiMode
  ? createApiRepositories()
  : (globalStore.__waafaRepositories ??= createFixtureRepositories());
