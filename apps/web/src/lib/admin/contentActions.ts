"use server";

import { adminWrite, type AdminProblem } from "./adminApi";
import type { ActionResult } from "./leadActions";
import type { ContentRecordResponse, ContentSingleton } from "./types";

export type SaveResult =
  | { ok: true; id?: string; version: number; updatedAt?: string; updatedBy?: string | null }
  | { ok: false; problem: AdminProblem };

const KEY = /^[a-zA-Z]{2,40}$/;
const ID = /^[\w-]{1,160}$/;
const at = (value: string) => encodeURIComponent(value);
/** Editors keep typed work on screen when the session ends, so a 401 comes back instead of a redirect (D0 R2). */
const KEEP = { signedOut: "problem" } as const;

function badKey(): { ok: false; problem: AdminProblem } {
  return { ok: false, problem: { status: 404, title: "Unknown content" } };
}

function savedRecord(result: { ok: true; data: ContentRecordResponse }): SaveResult {
  return {
    ok: true,
    id: result.data.id,
    version: result.data.version,
    updatedAt: result.data.updatedAt,
    updatedBy: result.data.updatedBy ?? null,
  };
}

/** Saves a settings value (validated by the API with its CONTENT_MODEL schema; `version` guards concurrent edits). */
export async function saveSetting(
  key: string,
  data: unknown,
  version?: number,
): Promise<SaveResult> {
  if (!KEY.test(key)) return badKey();
  const result = await adminWrite<ContentSingleton>(
    `/admin/settings/${at(key)}`,
    "PUT",
    { data, ...(version ? { version } : {}) },
    KEEP,
  );
  return result.ok
    ? {
        ok: true,
        version: result.data.version,
        updatedAt: result.data.updatedAt,
        updatedBy: result.data.updatedBy,
      }
    : result;
}

export async function saveRecord(
  key: string,
  id: string,
  data: unknown,
  version?: number,
): Promise<SaveResult> {
  if (!KEY.test(key) || !ID.test(id)) return badKey();
  const result = await adminWrite<ContentRecordResponse>(
    `/admin/content/${at(key)}/${at(id)}`,
    "PUT",
    { data, ...(version ? { version } : {}) },
    KEEP,
  );
  return result.ok ? savedRecord(result) : result;
}

export async function createRecord(key: string, data: unknown): Promise<SaveResult> {
  if (!KEY.test(key)) return badKey();
  const result = await adminWrite<ContentRecordResponse>(
    `/admin/content/${at(key)}`,
    "POST",
    { data },
    KEEP,
  );
  return result.ok ? savedRecord(result) : result;
}

/** Brings back a saved version of a record (or a setting when `id` is null) from History. */
export async function restoreVersion(
  key: string,
  id: string | null,
  auditId: string,
  version?: number,
): Promise<SaveResult> {
  if (!KEY.test(key) || (id !== null && !ID.test(id)) || !ID.test(auditId)) return badKey();
  const body = { auditId, ...(version ? { version } : {}) };
  if (id === null) {
    const result = await adminWrite<ContentSingleton>(
      `/admin/settings/${at(key)}/restore`,
      "POST",
      body,
      KEEP,
    );
    return result.ok
      ? {
          ok: true,
          version: result.data.version,
          updatedAt: result.data.updatedAt,
          updatedBy: result.data.updatedBy,
        }
      : result;
  }
  const result = await adminWrite<ContentRecordResponse>(
    `/admin/content/${at(key)}/${at(id)}/restore`,
    "POST",
    body,
    KEEP,
  );
  return result.ok ? savedRecord(result) : result;
}

/** Saves a copy as a hidden draft with "(copy)" in its title and a free id. */
export async function duplicateRecord(key: string, id: string): Promise<SaveResult> {
  if (!KEY.test(key) || !ID.test(id)) return badKey();
  const result = await adminWrite<ContentRecordResponse>(
    `/admin/content/${at(key)}/${at(id)}/duplicate`,
    "POST",
    undefined,
    KEEP,
  );
  return result.ok ? savedRecord(result) : result;
}

export async function deleteRecord(key: string, id: string): Promise<ActionResult> {
  if (!KEY.test(key) || !ID.test(id)) return badKey();
  const result = await adminWrite(`/admin/content/${at(key)}/${at(id)}`, "DELETE", undefined, KEEP);
  return result.ok ? { ok: true } : result;
}

export async function reorderRecords(key: string, ids: string[]): Promise<ActionResult> {
  if (!KEY.test(key)) return badKey();
  const result = await adminWrite(`/admin/content/${at(key)}/order`, "PUT", { ids });
  return result.ok ? { ok: true } : result;
}
