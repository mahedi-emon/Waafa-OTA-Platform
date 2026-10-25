import "server-only";
import type { CustomerFileLink, CustomerFileOwner } from "@waafa/shared";
import { apiConfig } from "@/lib/data/api/apiClient";
import { adminGet, adminWrite, type AdminResult } from "./adminApi";

/** One file a record holds, as the API lists it (issue 232). */
export type CustomerFileRow = {
  storageKey: string;
  kind: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  scanStatus: string;
  /** attached, or deleted once its retention ended. */
  status: string;
  createdAt: string;
  deletedAt: string | null;
};

/** The files a lead, order, payment proof or feedback holds; the API checks the staff member may see the record. */
export function listCustomerFiles(
  owner: CustomerFileOwner,
  id: string,
): Promise<CustomerFileRow[]> {
  return adminGet<CustomerFileRow[]>("/admin/files", { owner, id });
}

/** A ten-minute signed link for one file (audited by the API). */
export function customerFileLink(storageKey: string): Promise<AdminResult<CustomerFileLink>> {
  return adminWrite<CustomerFileLink>(
    "/admin/files/link",
    "POST",
    { storageKey },
    { signedOut: "problem" },
  );
}

/** The file behind a signed link, streamed from the API (the download is audited there). */
export async function fetchSignedFile(token: string): Promise<Response> {
  const api = apiConfig();
  if (!api) return new Response(null, { status: 404 });
  const url = new URL(`${api.baseUrl}/api/v1/public/files/signed`);
  url.searchParams.set("token", token);
  return fetch(url, {
    headers: { "x-intake-key": api.intakeKey },
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
}
