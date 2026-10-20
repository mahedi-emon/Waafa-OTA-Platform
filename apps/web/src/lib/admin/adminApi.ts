import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@waafa/shared";
import { apiConfig } from "@/lib/data/api/apiClient";
import { ACCESS_COOKIE } from "./tokens";

/** A problem from the admin API (RFC 7807), with field errors when validation failed. */
export type AdminProblem = {
  status: number;
  title: string;
  detail?: string;
  code?: string;
  fields?: Array<{ path: string; message: string }>;
  /** With a stale-version conflict: who saved last and when (D0 R2). */
  current?: { version: number; updatedBy: string | null; updatedAt: string };
};

export type AdminResult<T> = { ok: true; data: T } | { ok: false; problem: AdminProblem };

export type StaffSession = { id: string; name: string; email: string; roles: Role[] };

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
};

/** The admin needs the API (D129): in fixture mode it shows a "connect the API" notice instead. */
export function adminAvailable(): boolean {
  return apiConfig() !== null;
}

async function send(path: string, options: RequestOptions = {}): Promise<Response> {
  const api = apiConfig();
  if (!api) throw new Error("The admin needs WAAFA_API_URL and WAAFA_INTAKE_KEY");
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) redirect("/secure-admin-control/sign-in");
  const url = new URL(`${api.baseUrl}/api/v1${path}`);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  return fetch(url, {
    method: options.method ?? "GET",
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/json",
      ...(options.body === undefined ? {} : { "content-type": "application/json" }),
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
}

async function problemOf(response: Response): Promise<AdminProblem> {
  const body = (await response.json().catch(() => ({}))) as Partial<AdminProblem>;
  return {
    status: response.status,
    title: body.title ?? "Something went wrong",
    ...(body.detail ? { detail: body.detail } : {}),
    ...(body.code ? { code: body.code } : {}),
    ...(body.fields ? { fields: body.fields } : {}),
    ...(body.current ? { current: body.current } : {}),
  };
}

/**
 * Reads for admin pages: the data, or the sign-in page when the session ended. Other failures throw to the page's
 * error boundary (a 403 says the role can't open it).
 */
export async function adminGet<T>(path: string, query?: RequestOptions["query"]): Promise<T> {
  const response = await send(path, { query });
  if (response.status === 401) redirect("/secure-admin-control/sign-in");
  if (!response.ok) {
    const problem = await problemOf(response);
    throw new Error(problem.status === 403 ? "forbidden" : `${problem.status} ${problem.title}`);
  }
  return (await response.json()) as T;
}

/**
 * Writes from server actions: the result or the problem, so forms can show field errors in place. Editors pass
 * `{ signedOut: "problem" }` to get a 401 back instead of a redirect, so typed work stays on screen (D0 R2).
 */
export async function adminWrite<T>(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
  options: { signedOut?: "redirect" | "problem" } = {},
): Promise<AdminResult<T>> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token && options.signedOut === "problem")
    return { ok: false, problem: { status: 401, title: "Signed out" } };
  const response = await send(path, { method, body });
  if (response.status === 401 && options.signedOut === "problem")
    return { ok: false, problem: { status: 401, title: "Signed out" } };
  if (response.status === 401) redirect("/secure-admin-control/sign-in");
  if (!response.ok) return { ok: false, problem: await problemOf(response) };
  const data = response.status === 204 ? (null as T) : ((await response.json()) as T);
  return { ok: true, data };
}

/** Raw response for downloads (CSV export). */
export async function adminDownload(
  path: string,
  query?: RequestOptions["query"],
): Promise<Response> {
  return send(path, { query });
}

/**
 * Sends a photo or video to the media library as the raw body (issue 109, D0 R3): the API checks the bytes and stores
 * it. A video arrives as a stream and is passed on as one, so the web server never holds 50 MB at once.
 */
export async function adminUpload<T>(
  path: string,
  body: ArrayBuffer | ReadableStream<Uint8Array>,
  contentType: string,
  query: Record<string, string>,
  options: { length?: number; timeoutMs?: number } = {},
): Promise<AdminResult<T>> {
  const api = apiConfig();
  if (!api) throw new Error("The admin needs WAAFA_API_URL and WAAFA_INTAKE_KEY");
  // Uploads come from the browser's own requests: an ended session is a 401 the page shows (D201), not a redirect
  // the request would follow to the sign-in page.
  const signedOut: AdminResult<T> = { ok: false, problem: { status: 401, title: "Signed out" } };
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return signedOut;
  const url = new URL(`${api.baseUrl}/api/v1${path}`);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  const init: RequestInit & { duplex?: "half" } = {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/json",
      "content-type": contentType,
      ...(options.length ? { "content-length": String(options.length) } : {}),
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(options.timeoutMs ?? 60_000),
    // Node's fetch needs this to send a stream body.
    ...(body instanceof ReadableStream ? { duplex: "half" as const } : {}),
  };
  const response = await fetch(url, init);
  if (response.status === 401) return signedOut;
  if (!response.ok) return { ok: false, problem: await problemOf(response) };
  return { ok: true, data: (await response.json()) as T };
}

/** Who is signed in, once per request; null without a valid session. */
export const getStaffSession = cache(async (): Promise<StaffSession | null> => {
  if (!adminAvailable()) return null;
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  const response = await send("/auth/me");
  if (!response.ok) return null;
  return (await response.json()) as StaffSession;
});

/** The signed-in staff member, or the sign-in page. */
export async function requireStaff(): Promise<StaffSession> {
  const staff = await getStaffSession();
  if (!staff) redirect("/secure-admin-control/sign-in");
  return staff;
}

export function hasRole(staff: StaffSession, ...roles: Role[]): boolean {
  return staff.roles.includes("super-admin") || roles.some((role) => staff.roles.includes(role));
}
