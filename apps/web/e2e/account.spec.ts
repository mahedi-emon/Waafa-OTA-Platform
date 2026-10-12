import { expect, test } from "@playwright/test";

/*
 * Customer sign-in (issue 134) ships switched off: with Settings › Accounts live off (the Sample default) there is
 * no Log in link, /login and /account are not found, and the Google start route sends visitors back to /login.
 */
test.describe("customer accounts while off", () => {
  test("no Log in link on the header or the phone menu", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Log in", exact: true })).toHaveCount(0);
  });

  test("/login and /account are not found", async ({ request }) => {
    for (const path of ["/login", "/account"]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(404);
    }
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
