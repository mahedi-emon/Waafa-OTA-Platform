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
    expect(location).toMatch(/\/login\?error=off$/);
    expect(location).not.toContain("accounts.google.com");
    expect(response.headers()["set-cookie"] ?? "").not.toContain("waafa_oauth");
  });

  test("the callback without a pending sign-in starts nothing", async ({ request }) => {
    const response = await request.get("/api/auth/google/callback?code=x&state=y", {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(303);
    expect(response.headers()["location"] ?? "").toMatch(/\/login\?error=expired$/);
    expect(response.headers()["set-cookie"] ?? "").not.toContain("waafa_customer=");
  });
});
