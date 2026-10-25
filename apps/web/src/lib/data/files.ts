import "server-only";
import { randomBytes } from "node:crypto";
import type {
  CustomerFileType,
  CustomerFileUploadQuery,
  CustomerFileUploaded,
} from "@waafa/shared";
import { ApiError, apiConfig, type IntakeContext } from "./api/apiClient";

/**
 * Sends a visitor's file to the API's private storage (issue 232) and returns the claim the form sends back with the
 * record. In fixture mode (no API) nothing is stored: the claim is a Sample key the in-memory repositories keep as it is.
 */
export async function uploadCustomerFile(
  bytes: Buffer,
  mimeType: CustomerFileType,
  query: CustomerFileUploadQuery,
  context: IntakeContext = {},
): Promise<CustomerFileUploaded> {
  const api = apiConfig();
  if (!api) {
    return {
      storageKey: `cf_${randomBytes(24).toString("base64url")}`,
      fileName: query.name,
      mimeType,
      sizeBytes: bytes.length,
    };
  }
  const url = new URL(`${api.baseUrl}/api/v1/public/files`);
  url.searchParams.set("kind", query.kind);
  url.searchParams.set("name", query.name);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": mimeType,
      "x-intake-key": api.intakeKey,
      ...(context.clientIp && context.clientIp !== "unknown"
        ? { "x-client-ip": context.clientIp }
        : {}),
    },
    body: new Uint8Array(bytes),
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) throw new ApiError(response.status, body);
  return body as CustomerFileUploaded;
}
