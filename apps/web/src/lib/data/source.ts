import "server-only";
import { createFixtureRepositories } from "./fixtures/createFixtureRepositories";
import type { Repositories } from "./types";

/**
 * The data source behind every accessor in this folder. Phase A reads the typed Sample fixtures; Phase C
 * points this at the API implementation of the same interfaces, so no page or component changes.
 */
export const repositories: Repositories = createFixtureRepositories();
