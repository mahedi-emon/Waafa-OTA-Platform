import { expect, test } from "@playwright/test";

/*
 * Customer sign-in (issues 134 and 146): Settings › Accounts live is on by default, so the header shows Log in and
 * /login opens; until Admin › Integrations › Sign-in has Google keys, /login says sign-in opens soon and the Google
 * start route sends visitors back to /login.
 */
test.describe("customer accounts before Google is connected", () => {
  test("the header shows Log in with its words from 1280 px", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const logIn = page.getByRole("banner").getByRole("link", { name: "Log in", exact: true });
    await expect(logIn).toBeVisible();
    await expect(logIn).toHaveText("Log in");
    await logIn.click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Sign-in opens soon.", { exact: false })).toBeVisible();
  });

  test("/account sends a guest to /login", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login\?next=(%2F|\/)account$/);
  });

  test("the Google start route goes nowhere near Google", async ({ request }) => {
    const response = await request.get("/api/auth/google/start?next=//evil.example.com", {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(303);
    const location = response.headers()["location"] ?? "";
    // Relative, so a local run stays on its own address (issue 138).
    expect(location).toBe("/login?error=off");
    expect(location).not.toContain("accounts.google.com");
    expect(response.headers()["set-cookie"] ?? "").not.toContain("waafa_oauth");
  });

  test("the callback without a pending sign-in starts nothing", async ({ request }) => {
    const response = await request.get("/api/auth/google/callback?code=x&state=y", {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(303);
    expect(response.headers()["location"]).toBe("/login?error=expired");
    expect(response.headers()["set-cookie"] ?? "").not.toContain("waafa_customer=");
  });
});

test.describe("account form posts (issue 138)", () => {
  test("log out and delete refuse another site and answer with relative 303s", async ({
    request,
    baseURL,
  }) => {
    const evil = await request.post("/api/account/sign-out", {
      headers: { origin: "https://evil.example.com" },
      maxRedirects: 0,
    });
    expect(evil.status()).toBe(403);

    const out = await request.post("/api/account/sign-out", {
      headers: { origin: baseURL ?? "" },
      maxRedirects: 0,
    });
    expect(out.status()).toBe(303);
    expect(out.headers()["location"]).toBe("/");
    expect(out.headers()["set-cookie"] ?? "").toMatch(/waafa_customer=;/);

    const unticked = await request.post("/api/account/delete", {
      headers: { origin: baseURL ?? "" },
      form: {},
      maxRedirects: 0,
    });
    expect(unticked.status()).toBe(303);
    expect(unticked.headers()["location"]).toBe("/account?error=confirm");

    // Ticked but without a session: nothing is deleted.
    const noSession = await request.post("/api/account/delete", {
      headers: { origin: baseURL ?? "" },
      form: { confirm: "yes" },
      maxRedirects: 0,
    });
    expect(noSession.status()).toBe(303);
    expect(noSession.headers()["location"]).toBe("/account?error=delete");
  });
});
