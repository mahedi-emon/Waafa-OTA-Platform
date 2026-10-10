"use server";

import { adminWrite, type AdminProblem } from "./adminApi";
import type { ActionResult } from "./leadActions";
import type { ContentRecordResponse, ContentSingleton } from "./types";

export type SaveResult =
  { ok: true; id?: string; version: number } | { ok: false; problem: AdminProblem };

const KEY = /^[a-zA-Z]{2,40}$/;
const at = (value: string) => encodeURIComponent(value);

function badKey(): SaveResult {
  return { ok: false, problem: { status: 404, title: "Unknown content" } };
}

/** Saves a settings value (validated by the API with its CONTENT_MODEL schema; `version` guards concurrent edits). */
export async function saveSetting(
  key: string,
  data: unknown,
  version?: number,
): Promise<SaveResult> {
  if (!KEY.test(key)) return badKey();
  const result = await adminWrite<ContentSingleton>(`/admin/settings/${at(key)}`, "PUT", {
    data,
    ...(version ? { version } : {}),
  });
  return result.ok ? { ok: true, version: result.data.version } : result;
}

export async function saveRecord(
  key: string,
  id: string,
  data: unknown,
  version?: number,
): Promise<SaveResult> {
  if (!KEY.test(key)) return badKey();
  const result = await adminWrite<ContentRecordResponse>(
    `/admin/content/${at(key)}/${at(id)}`,
    "PUT",
    {
      data,
      ...(version ? { version } : {}),
    },
  );
  return result.ok ? { ok: true, id: result.data.id, version: result.data.version } : result;
}

export async function createRecord(key: string, data: unknown): Promise<SaveResult> {
  if (!KEY.test(key)) return badKey();
  const result = await adminWrite<ContentRecordResponse>(`/admin/content/${at(key)}`, "POST", {
    data,
  });
  return result.ok ? { ok: true, id: result.data.id, version: result.data.version } : result;
}

export async function deleteRecord(key: string, id: string): Promise<ActionResult> {
  if (!KEY.test(key)) return { ok: false, problem: { status: 404, title: "Unknown content" } };
  const result = await adminWrite(`/admin/content/${at(key)}/${at(id)}`, "DELETE");
  return result.ok ? { ok: true } : result;
}

export async function reorderRecords(key: string, ids: string[]): Promise<ActionResult> {
  if (!KEY.test(key)) return { ok: false, problem: { status: 404, title: "Unknown content" } };
  const result = await adminWrite(`/admin/content/${at(key)}/order`, "PUT", { ids });
  return result.ok ? { ok: true } : result;
}
