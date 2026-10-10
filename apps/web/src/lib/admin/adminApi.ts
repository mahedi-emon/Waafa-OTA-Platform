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
  if (!token) redirect("/admin/sign-in");
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
  };
}

/**
 * Reads for admin pages: the data, or the sign-in page when the session ended. Other failures throw to the page's
 * error boundary (a 403 says the role can't open it).
 */
export async function adminGet<T>(path: string, query?: RequestOptions["query"]): Promise<T> {
  const response = await send(path, { query });
  if (response.status === 401) redirect("/admin/sign-in");
  if (!response.ok) {
    const problem = await problemOf(response);
    throw new Error(problem.status === 403 ? "forbidden" : `${problem.status} ${problem.title}`);
  }
  return (await response.json()) as T;
}

/** Writes from server actions: the result or the problem, so forms can show field errors in place. */
export async function adminWrite<T>(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<AdminResult<T>> {
  const response = await send(path, { method, body });
  if (response.status === 401) redirect("/admin/sign-in");
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
  if (!staff) redirect("/admin/sign-in");
  return staff;
}

export function hasRole(staff: StaffSession, ...roles: Role[]): boolean {
  return staff.roles.includes("super-admin") || roles.some((role) => staff.roles.includes(role));
}
