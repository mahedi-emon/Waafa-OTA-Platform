import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test as setup } from "@playwright/test";
import { totpCode } from "./totp";

/*
 * Two-step sign-in (issue 234) for the end-to-end runs: the seed Super Admin must use it. This setup signs in once
 * (setting up the authenticator on a fresh database), ticks "Trust this device for 30 days" and keeps only the
 * browser's device cookie, which every spec then starts with: their own sign-ins see a trusted device and go
 * straight in. The secret stays in e2e/.auth (git-ignored) for local runs on the same database.
 */
const API = process.env.WAAFA_API_URL ?? "";
const INTAKE_KEY = process.env.WAAFA_INTAKE_KEY ?? "";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "owner@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";

export const AUTH_DIR = path.join(process.cwd(), "e2e", ".auth");
export const DEVICE_STATE = path.join(AUTH_DIR, "staff-device.json");
const SECRET_FILE = path.join(AUTH_DIR, "owner-two-step.json");

type Saved = { email: string; secret: string; recoveryCodes: string[] };

function saved(): Saved | null {
  try {
    const value = JSON.parse(readFileSync(SECRET_FILE, "utf8")) as Saved;
    return value.email === ADMIN_EMAIL ? value : null;
  } catch {
    return null;
  }
}

setup("trust this browser for the seed Super Admin", async ({ page }) => {
  mkdirSync(AUTH_DIR, { recursive: true });
  if (!API || !INTAKE_KEY || !ADMIN_PASSWORD) {
    // Fixture mode: no staff sign-in, nothing to keep.
    writeFileSync(DEVICE_STATE, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }
  setup.setTimeout(90_000);
  await page.setExtraHTTPHeaders({ "x-forwarded-for": "198.51.100.250" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/secure-admin-control/sign-in");
  await page.getByLabel("Work email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  const hello = page.getByRole("heading", { level: 1, name: /^Hello, / });
  const enrol = page.getByRole("heading", { name: "Set up two-step sign-in" });
  const code = page.getByRole("heading", { name: "Enter your sign-in code" });
  await expect(hello.or(enrol).or(code)).toBeVisible({ timeout: 30_000 });

  if (await enrol.isVisible()) {
    const key = (await page.locator("code").first().textContent()) ?? "";
    const secret = key.replace(/\s/g, "");
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    // Trust first: the sixth digit sends the form.
    await page.getByLabel("Trust this device for 30 days").check();
    await page.getByLabel("6-digit code").fill(totpCode(secret));
    await expect(page.getByRole("heading", { name: "Save your recovery codes" })).toBeVisible();
    const recoveryCodes = await page
      .getByRole("list", { name: "Your recovery codes" })
      .getByRole("listitem")
      .allTextContents();
    expect(recoveryCodes).toHaveLength(10);
    writeFileSync(SECRET_FILE, JSON.stringify({ email: ADMIN_EMAIL, secret, recoveryCodes }));
    await page.getByLabel("I saved my recovery codes").check();
    await page.getByRole("button", { name: "Continue to Admin" }).click();
  } else if (await code.isVisible()) {
    const known = saved();
    if (!known) {
      throw new Error(
        `${ADMIN_EMAIL} already has two-step sign-in and e2e/.auth has no secret for it: reset it in Users, or use a fresh database.`,
      );
    }
    await page.getByLabel("Trust this device for 30 days").check();
    await page.getByLabel("6-digit code").fill(totpCode(known.secret));
  }
  await expect(hello).toBeVisible({ timeout: 30_000 });

  const state = await page.context().storageState();
  writeFileSync(
    DEVICE_STATE,
    JSON.stringify({
      cookies: state.cookies.filter((cookie) => cookie.name === "waafa_admin_device"),
      origins: [],
    }),
  );
});
