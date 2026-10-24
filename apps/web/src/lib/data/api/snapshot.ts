import "server-only";
import { fixtureRegistry, type FixtureData, type FixtureKey } from "@waafa/fixtures";
import { cacheLife, cacheTag } from "next/cache";
import { draftMode } from "next/headers";
import { CACHE_TAGS } from "../tags";
import { apiConfig, callApi, type ApiConfig } from "./apiClient";
import { previewDrafts } from "./previewDrafts";

/** The last snapshot this server read, served when the API is briefly unreachable. */
let lastGood: FixtureData | null = null;

/**
 * One preview read, shared by every accessor of the same page for a moment (draft mode skips the cache). It lives on
 * globalThis because pages, route handlers and server actions are bundled as separate module graphs, and a save or
 * a revalidation must be able to drop it.
 */
const store = globalThis as typeof globalThis & {
  __waafaPreview?: { at: number; data: Promise<FixtureData> } | null;
};
const PREVIEW_REUSE_MS = 1_000;

/** Drops the shared preview read, so the next preview page reads the API again (after a save or a revalidation). */
export function forgetPreviewSnapshot(): void {
  store.__waafaPreview = null;
}

/**
 * Parses the API's snapshot with the same schemas the fixtures use, so every repository reads exactly the shape it
 * was built and tested on. A key that fails its schema is reported with its name.
 */
export function parseSnapshot(body: Record<string, unknown>): FixtureData {
  const data: Partial<Record<FixtureKey, unknown>> = {};
  for (const key of Object.keys(fixtureRegistry) as FixtureKey[]) {
    const result = fixtureRegistry[key].schema.safeParse(body[key] ?? []);
    if (!result.success) {
      const issue = result.error.issues[0];
      throw new Error(
        `Snapshot key "${key}" does not match its schema at ${issue?.path.join(".") ?? "?"}: ${issue?.message ?? ""}`,
      );
    }
    data[key] = result.data;
  }
  return data as FixtureData;
}

/** Preview of unpublished changes (D0 R7): a fresh read with drafts and scheduled records shown as Live. */
function readPreview(config: ApiConfig): Promise<FixtureData> {
  const shared = store.__waafaPreview;
  if (shared && Date.now() - shared.at < PREVIEW_REUSE_MS) return shared.data;
  const data = callApi<Record<string, unknown>>(config, "/api/v1/public/snapshot", {
    timeoutMs: 15_000,
  }).then((body) => parseSnapshot(previewDrafts(body, new Date())));
  const entry = { at: Date.now(), data };
  store.__waafaPreview = entry;
  data.catch(() => {
    if (store.__waafaPreview === entry) store.__waafaPreview = null;
  });
  return data;
}

/**
 * Every public read starts here in API mode: one cached request for all published content (D130). Admin saves expire
 * the `snapshot` tag through /api/revalidate, so the site follows within seconds; the hours lifetime is a safety
 * net. When the API is briefly unreachable, the last good snapshot is served for a few seconds at a time. In draft
 * mode (staff only) Next runs this on every request without caching it, and drafts read as published; the last good
 * snapshot stays the live one.
 */
export async function readSnapshot(): Promise<FixtureData> {
  "use cache";
  cacheTag(CACHE_TAGS.snapshot);
  const config = apiConfig();
  if (!config) throw new Error("readSnapshot needs WAAFA_API_URL and WAAFA_INTAKE_KEY");
  if ((await draftMode()).isEnabled) return readPreview(config);
  try {
    const body = await callApi<Record<string, unknown>>(config, "/api/v1/public/snapshot", {
      timeoutMs: 15_000,
    });
    lastGood = parseSnapshot(body);
    cacheLife("hours");
    return lastGood;
  } catch (error) {
    if (!lastGood) throw error;
    cacheLife("seconds");
    return lastGood;
  }
}
