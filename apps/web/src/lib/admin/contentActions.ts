"use server";

import type { ContentActionInput } from "@waafa/shared";
import { adminWrite, type AdminProblem } from "./adminApi";
import type { ActionResult } from "./leadActions";
import type { ContentRecordResponse, ContentSingleton } from "./types";

export type SaveResult =
  | {
      ok: true;
      id?: string;
      version: number;
      updatedAt?: string;
      updatedBy?: string | null;
      /** The record as the API saved it: the status and times its button set (D0 R4). */
      data?: unknown;
      /** The first staff save made a Sample record the team's own; the editor offers Undo. */
      sampleCleared?: boolean;
    }
  | { ok: false; problem: AdminProblem };

/** The editor's button and the Undo of "no longer Sample" (D0 R4). */
export type SaveOptions = { action?: ContentActionInput; keepSample?: boolean };

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
    data: result.data.data,
    sampleCleared: result.data.sampleCleared === true,
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
  options: SaveOptions = {},
): Promise<SaveResult> {
  if (!KEY.test(key) || !ID.test(id)) return badKey();
  const result = await adminWrite<ContentRecordResponse>(
    `/admin/content/${at(key)}/${at(id)}`,
    "PUT",
    {
      data,
      ...(version ? { version } : {}),
      ...(options.action ? { action: options.action } : {}),
      ...(options.keepSample ? { keepSample: true } : {}),
    },
    KEEP,
  );
  return result.ok ? savedRecord(result) : result;
}

export async function createRecord(
  key: string,
  data: unknown,
  options: SaveOptions = {},
): Promise<SaveResult> {
  if (!KEY.test(key)) return badKey();
  const result = await adminWrite<ContentRecordResponse>(
    `/admin/content/${at(key)}`,
    "POST",
    { data, ...(options.action ? { action: options.action } : {}) },
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
  side: "before" | "after" = "after",
): Promise<SaveResult> {
  if (!KEY.test(key) || (id !== null && !ID.test(id)) || !ID.test(auditId)) return badKey();
  const body = { auditId, side, ...(version ? { version } : {}) };
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

/** Moves a record to Trash (D0 R4); the answer names the Trash item, so the toast can undo it. */
export async function deleteRecord(
  key: string,
  id: string,
): Promise<{ ok: true; trashId?: string } | { ok: false; problem: AdminProblem }> {
  if (!KEY.test(key) || !ID.test(id)) return badKey();
  const result = await adminWrite<{ trashId: string }>(
    `/admin/content/${at(key)}/${at(id)}`,
    "DELETE",
    undefined,
    KEEP,
  );
  return result.ok ? { ok: true, trashId: result.data.trashId } : result;
}

/** Puts a record back from Trash; the answer says where its editor is. */
export async function restoreTrashItem(
  id: string,
): Promise<{ ok: true; href?: string } | { ok: false; problem: AdminProblem }> {
  if (!ID.test(id)) return badKey();
  const result = await adminWrite<{ collection: string; id: string }>(
    `/admin/trash/${at(id)}/restore`,
    "POST",
    undefined,
    KEEP,
  );
  return result.ok
    ? {
        ok: true,
        href: `/secure-admin-control/content/${at(result.data.collection)}/${at(result.data.id)}`,
      }
    : result;
}

/** Deletes a record in Trash for good (Super Admin). */
export async function purgeTrashItem(id: string): Promise<ActionResult> {
  if (!ID.test(id)) return badKey();
  const result = await adminWrite(`/admin/trash/${at(id)}`, "DELETE", undefined, KEEP);
  return result.ok ? { ok: true } : result;
}

/** The same step for several records of a list (the table's bulk bar, D0 R5). */
export async function bulkContent(
  key: string,
  action: "publish" | "unpublish" | "archive" | "trash",
  ids: string[],
): Promise<{ ok: boolean; changed?: number; message?: string }> {
  if (!KEY.test(key) || ids.length === 0 || ids.some((id) => !ID.test(id))) return { ok: false };
  const result = await adminWrite<{ changed: number; skipped: string[] }>(
    `/admin/content/${at(key)}/bulk`,
    "POST",
    { ids, action },
    KEEP,
  );
  return result.ok
    ? { ok: true, changed: result.data.changed }
    : { ok: false, ...(result.problem.detail ? { message: result.problem.detail } : {}) };
}

/** One record a place earlier or later in its list (the table's row action, D0 R5). */
export async function moveRecord(key: string, id: string, by: -1 | 1): Promise<ActionResult> {
  if (!KEY.test(key) || !ID.test(id)) return badKey();
  const result = await adminWrite(`/admin/content/${at(key)}/${at(id)}/move`, "POST", { by }, KEEP);
  return result.ok ? { ok: true } : result;
}
