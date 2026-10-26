"use server";

import { cookies, draftMode, headers } from "next/headers";
import { redirect } from "next/navigation";
import { apiConfig } from "@/lib/data/api/apiClient";
import { clientKey } from "@/lib/rateLimit";
import { PREVIEW_HINT_COOKIE, STAFF_HINT_COOKIE } from "@/lib/staffHint";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  REMEMBER_COOKIE,
  safeNext,
  sessionCookies,
  type SessionTokens,
} from "./tokens";
import {
  DEVICE_COOKIE,
  TWO_STEP_COOKIE,
  decodePending,
  deviceCookieOptions,
  encodePending,
  groupedKey,
  isDeviceId,
  newDeviceId,
  qrRows,
  twoStepCookieOptions,
  type PendingTwoStep,
} from "./twoStep";

export type SignInStage = "password" | "code" | "enrol" | "saved";

export type SignInState = {
  stage: SignInStage;
  error:
    | null
    | "missing"
    | "wrong"
    | "locked"
    | "unavailable"
    | "wrong-code"
    | "expired"
    | "missing-code";
  email?: string;
  /** Setting up the authenticator: the QR code (rows of 0 and 1) and the key to type by hand. */
  enrol?: { qr: string[]; key: string };
  /** Shown once after setup; the session is already open. */
  recoveryCodes?: string[];
  next?: string;
  /** Counts failed codes, so the code boxes start empty again after each one. */
  attempt?: number;
};

type LoginAnswer =
  | ({ step: "done"; recoveryCodes?: string[] } & SessionTokens)
  | { step: "code"; challenge: string }
  | { step: "enrol"; challenge: string; secret: string; otpauthUrl: string };

/** The browser's device id, made on its first sign-in (new-device emails, trusted devices; issue 234). */
async function deviceId(): Promise<string> {
  const store = await cookies();
  const current = store.get(DEVICE_COOKIE)?.value;
  if (isDeviceId(current)) return current;
  const created = newDeviceId();
  store.set(DEVICE_COOKIE, created, deviceCookieOptions());
  return created;
}

async function callApi(path: string, body: unknown): Promise<Response | null> {
  const api = apiConfig();
  if (!api) return null;
  const incoming = await headers();
  try {
    return await fetch(`${api.baseUrl}/api/v1${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-intake-key": api.intakeKey,
        "x-client-ip": clientKey(incoming),
        "user-agent": incoming.get("user-agent")?.slice(0, 200) ?? "unknown",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return null;
  }
}

/** Session cookies, "Keep me signed in" and the staff hint for the public site, after the last step. */
async function openSession(tokens: SessionTokens, remember: boolean): Promise<void> {
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
  // Lets the public site load "Edit this page" for staff; a readable hint that grants nothing (D0 R7). It lives as
  // long as the session can: past the browser session only with "Keep me signed in".
  store.set(STAFF_HINT_COOKIE, "1", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(remember ? { expires: new Date(tokens.refreshExpiresAt) } : {}),
  });
  store.delete({ name: TWO_STEP_COOKIE, path: twoStepCookieOptions().path });
}

async function rememberStep(pending: PendingTwoStep): Promise<void> {
  (await cookies()).set(TWO_STEP_COOKIE, encodePending(pending), twoStepCookieOptions());
}

/**
 * Staff sign-in (AdminLogin board, D129; issue 234): the API checks the password, the lockout and the per-address
 * limit; when two-step sign-in is on it asks for a code, and for Super Admin and Admin without it, for setting it up.
 * This server keeps the tokens in httpOnly cookies and sends the person on to the page they wanted.
 */
export async function signIn(previous: SignInState, form: FormData): Promise<SignInState> {
  const stage = form.get("stage");
  if (stage === "code" || stage === "enrol") return secondStep(previous, form);
  if (stage === "saved") redirect(safeNext(previous.next));

  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const remember = form.get("remember") === "on";
  const next = safeNext(form.get("next"));
  if (!email || !password) return { stage: "password", error: "missing", email };

  const response = await callApi("/auth/login", { email, password, device: await deviceId() });
  if (!response) return { stage: "password", error: "unavailable", email };
  if (response.status === 401) return { stage: "password", error: "wrong", email };
  if (response.status === 429) return { stage: "password", error: "locked", email };
  if (response.status === 422) return { stage: "password", error: "missing", email };
  if (!response.ok) return { stage: "password", error: "unavailable", email };

  const answer = (await response.json()) as LoginAnswer;
  if (answer.step === "code") {
    await rememberStep({ step: "code", challenge: answer.challenge, remember, next });
    return { stage: "code", error: null, email };
  }
  if (answer.step === "enrol") {
    await rememberStep({ step: "enrol", challenge: answer.challenge, remember, next });
    return {
      stage: "enrol",
      error: null,
      email,
      enrol: { qr: qrRows(answer.otpauthUrl), key: groupedKey(answer.secret) },
    };
  }
  await openSession(answer, remember);
  redirect(next);
}

/** The code after the password, or the first code from a newly added authenticator. */
async function secondStep(previous: SignInState, form: FormData): Promise<SignInState> {
  const store = await cookies();
  const pending = decodePending(store.get(TWO_STEP_COOKIE)?.value);
  const email = previous.email;
  if (!pending) return { stage: "password", error: "expired", email };
  const code = String(form.get("code") ?? "").trim();
  if (!code) return { ...previous, error: "missing-code", attempt: (previous.attempt ?? 0) + 1 };
  const response = await callApi(
    pending.step === "enrol" ? "/auth/login/enrol" : "/auth/login/code",
    {
      challenge: pending.challenge,
      code,
      device: await deviceId(),
      trustDevice: form.get("trust") === "on",
    },
  );
  if (!response) return { ...previous, error: "unavailable" };
  if (response.status === 401) {
    store.delete({ name: TWO_STEP_COOKIE, path: twoStepCookieOptions().path });
    return { stage: "password", error: "expired", email };
  }
  if (response.status === 429) {
    store.delete({ name: TWO_STEP_COOKIE, path: twoStepCookieOptions().path });
    return { stage: "password", error: "locked", email };
  }
  if (response.status === 400 || response.status === 422)
    return { ...previous, error: "wrong-code", attempt: (previous.attempt ?? 0) + 1 };
  if (!response.ok) return { ...previous, error: "unavailable" };

  const answer = (await response.json()) as LoginAnswer;
  if (answer.step !== "done") return { stage: "password", error: "expired", email };
  await openSession(answer, pending.remember);
  if (answer.recoveryCodes?.length) {
    return {
      stage: "saved",
      error: null,
      email,
      recoveryCodes: answer.recoveryCodes,
      next: pending.next,
    };
  }
  redirect(safeNext(pending.next));
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
  store.delete(STAFF_HINT_COOKIE);
  store.delete(PREVIEW_HINT_COOKIE);
  (await draftMode()).disable();
  redirect("/secure-admin-control/sign-in");
}
