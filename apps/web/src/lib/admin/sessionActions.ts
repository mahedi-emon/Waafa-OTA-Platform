"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { apiConfig } from "@/lib/data/api/apiClient";
import { clientKey } from "@/lib/rateLimit";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  REMEMBER_COOKIE,
  safeNext,
  sessionCookies,
  type SessionTokens,
} from "./tokens";

export type SignInState = {
  error: null | "missing" | "wrong" | "locked" | "unavailable";
  email?: string;
};

/**
 * Staff sign-in (AdminLogin board, D129): the API checks the password, the lockout and the per-address limit; this
 * server keeps the tokens in httpOnly cookies and sends the person on to the page they wanted.
 */
export async function signIn(_previous: SignInState, form: FormData): Promise<SignInState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const remember = form.get("remember") === "on";
  if (!email || !password) return { error: "missing", email };
  const api = apiConfig();
  if (!api) return { error: "unavailable", email };

  const incoming = await headers();
  let response: Response;
  try {
    response = await fetch(`${api.baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-intake-key": api.intakeKey,
        "x-client-ip": clientKey(incoming),
        "user-agent": incoming.get("user-agent")?.slice(0, 200) ?? "unknown",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { error: "unavailable", email };
  }
  if (response.status === 401) return { error: "wrong", email };
  if (response.status === 429) return { error: "locked", email };
  if (response.status === 422) return { error: "missing", email };
  if (!response.ok) return { error: "unavailable", email };

  const tokens = (await response.json()) as SessionTokens;
  const store = await cookies();
  for (const cookie of sessionCookies(tokens, remember))
    store.set(cookie.name, cookie.value, cookie.options);
  if (remember) {
    store.set(REMEMBER_COOKIE, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(tokens.refreshExpiresAt),
    });
  } else {
    store.delete(REMEMBER_COOKIE);
  }
  redirect(safeNext(form.get("next")));
}

/** Ends the session at the API and clears the cookies. */
export async function signOut(): Promise<void> {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  const api = apiConfig();
  if (api && refreshToken) {
    await fetch(`${api.baseUrl}/api/v1/auth/logout`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    }).catch(() => undefined);
  }
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
  store.delete(REMEMBER_COOKIE);
  redirect("/admin/sign-in");
}
