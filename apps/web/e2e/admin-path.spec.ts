import { expect, test } from "@playwright/test";

/* #85: the admin panel is not at the guessable /admin; those paths are the ordinary 404. */
test("the old /admin paths answer 404", async ({ page }) => {
  for (const path of ["/admin", "/admin/sign-in", "/admin/leads", "/en/admin"]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
  }
});

test("robots.txt does not name the admin path", async ({ request }) => {
  const body = await (await request.get("/robots.txt")).text();
  expect(body).not.toContain("admin");
});
