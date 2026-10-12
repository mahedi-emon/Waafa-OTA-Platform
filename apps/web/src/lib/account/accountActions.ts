"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { deleteAccount, endSession } from "./accountApi";
import { SESSION_COOKIE } from "./googleOAuth";

/** Ends this session at the API and clears the cookie (issue 134). */
export async function signOutCustomer(): Promise<void> {
  const store = await cookies();
  await endSession(store.get(SESSION_COOKIE)?.value);
  store.delete(SESSION_COOKIE);
  redirect("/");
}

/**
 * Deletes the account after the visitor ticks the confirmation (issue 134). Requests and orders stay with the
 * business; signing in with Google again starts a new account.
 */
export async function deleteCustomerAccount(form: FormData): Promise<void> {
  if (form.get("confirm") !== "yes") redirect("/account?error=confirm");
  const store = await cookies();
  const deleted = await deleteAccount(store.get(SESSION_COOKIE)?.value);
  if (!deleted) redirect("/account?error=delete");
  store.delete(SESSION_COOKIE);
  redirect("/login?deleted=1");
}
