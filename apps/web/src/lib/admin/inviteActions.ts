"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { apiConfig } from "@/lib/data/api/apiClient";
import { clientKey } from "@/lib/rateLimit";

export type WelcomeState = {
  error: null | "short" | "different" | "expired" | "tooMany" | "unavailable";
};

const TOKEN = /^[A-Za-z0-9_-]{32,128}$/;
const MIN_LENGTH = 12;

/**
 * The welcome page from an invite email (D0 R9): the chosen password is set through the API, then the person signs in
 * with it. A wrong, used or expired link reads the same, so the page never tells which emails have accounts.
 */
export async function acceptInvite(_previous: WelcomeState, form: FormData): Promise<WelcomeState> {
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  const again = String(form.get("again") ?? "");
  if (!TOKEN.test(token)) return { error: "expired" };
  if (password.length < MIN_LENGTH) return { error: "short" };
  if (password !== again) return { error: "different" };
  const api = apiConfig();
  if (!api) return { error: "unavailable" };

  const incoming = await headers();
  let response: Response;
  try {
    response = await fetch(`${api.baseUrl}/api/v1/auth/invite`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-intake-key": api.intakeKey,
        "x-client-ip": clientKey(incoming),
      },
      body: JSON.stringify({ token, password }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { error: "unavailable" };
  }
  if (response.status === 400) return { error: "expired" };
  if (response.status === 429) return { error: "tooMany" };
  if (response.status === 422) return { error: "short" };
  if (!response.ok) return { error: "unavailable" };
  redirect("/secure-admin-control/sign-in?welcome=1");
}
