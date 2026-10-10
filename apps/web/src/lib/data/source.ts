import "server-only";
import { createFixtureRepositories } from "./fixtures/createFixtureRepositories";
import type { Repositories } from "./types";

/*
 * Next.js bundles route handlers and pages as separate module graphs, so a plain module-level instance would be two
 * different in-memory stores (an order placed through /api/orders would be invisible to /shop/track). Phase A keeps
 * the one fixture store on globalThis; Phase C replaces this with the API client, which has no local state.
 */
const globalStore = globalThis as typeof globalThis & { __waafaRepositories?: Repositories };

/**
 * The data source behind every accessor in this folder. Phase A reads the typed Sample fixtures; Phase C
 * points this at the API implementation of the same interfaces, so no page or component changes.
 */
export const repositories: Repositories = (globalStore.__waafaRepositories ??=
  createFixtureRepositories());
