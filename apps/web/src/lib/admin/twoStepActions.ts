"use server";

import { TwoStepCodeSchema } from "@waafa/shared";
import { adminWrite, type AdminResult } from "./adminApi";
import { groupedKey, qrRows } from "./twoStep";

const badCode: AdminResult<never> = {
  ok: false,
  problem: { status: 400, title: "Bad request", code: "wrong-code" },
};

export type TwoStepSetup = { challenge: string; qr: string[]; key: string };

/** My account: a new authenticator secret to scan; nothing changes until a code from it is confirmed (issue 234). */
export async function startTwoStepSetup(): Promise<AdminResult<TwoStepSetup>> {
  const result = await adminWrite<{ challenge: string; secret: string; otpauthUrl: string }>(
    "/auth/two-step/start",
    "POST",
  );
  if (!result.ok) return result;
  return {
    ok: true,
    data: {
      challenge: result.data.challenge,
      qr: qrRows(result.data.otpauthUrl),
      key: groupedKey(result.data.secret),
    },
  };
}

export async function confirmTwoStepSetup(
  challenge: string,
  code: string,
): Promise<AdminResult<{ recoveryCodes: string[] }>> {
  if (!TwoStepCodeSchema.safeParse(code).success) return badCode;
  return adminWrite("/auth/two-step/confirm", "POST", { challenge, code });
}

/** Replaces every recovery code; needs a current code from the app. */
export async function makeRecoveryCodes(
  code: string,
): Promise<AdminResult<{ recoveryCodes: string[] }>> {
  if (!TwoStepCodeSchema.safeParse(code).success) return badCode;
  return adminWrite("/auth/two-step/recovery-codes", "POST", { code });
}

export async function turnOffTwoStep(password: string): Promise<AdminResult<null>> {
  if (!password) {
    return { ok: false, problem: { status: 400, title: "Bad request", code: "wrong-password" } };
  }
  return adminWrite("/auth/two-step/off", "POST", { password });
}

/** Super Admin, in Users: someone lost their phone and recovery codes; their next sign-in sets it up again. */
export async function resetStaffTwoStep(id: string): Promise<AdminResult<null>> {
  return adminWrite(`/admin/users/${encodeURIComponent(id)}/two-step/reset`, "POST");
}
