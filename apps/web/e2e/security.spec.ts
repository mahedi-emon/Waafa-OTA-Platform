import { expect, test } from "@playwright/test";
import { collectErrors } from "./errors";

/* Security headers and analytics consent (issue 102). */
test("every page sends the CSP and hardening headers", async ({ request }) => {
  // Public pages may be framed by the site itself only (the admin's live previews, D243); the admin by nobody.
  const framing: Record<string, { ancestors: string; frameOptions: string }> = {
    "/": { ancestors: "frame-ancestors 'self'", frameOptions: "SAMEORIGIN" },
    "/flights": { ancestors: "frame-ancestors 'self'", frameOptions: "SAMEORIGIN" },
    "/shop": { ancestors: "frame-ancestors 'self'", frameOptions: "SAMEORIGIN" },
    "/secure-admin-control/sign-in": {
      ancestors: "frame-ancestors 'none'",
      frameOptions: "DENY",
    },
  };
  for (const [path, want] of Object.entries(framing)) {
    const response = await request.get(path);
    const headers = response.headers();
    expect(headers["content-security-policy"], path).toContain(want.ancestors);
    expect(headers["content-security-policy"], path).toContain("object-src 'none'");
    expect(headers["x-content-type-options"], path).toBe("nosniff");
    expect(headers["x-frame-options"], path).toBe(want.frameOptions);
    expect(headers["referrer-policy"], path).toBe("strict-origin-when-cross-origin");
    expect(headers["x-powered-by"], path).toBeUndefined();
  }
  const admin = (await request.get("/secure-admin-control/sign-in")).headers();
  expect(admin["content-security-policy"]).toContain("frame-src 'self'");
});

test("the site runs under its CSP without violations and loads no tracker by default", async ({
  page,
}) => {
  const errors = collectErrors(page);
  const thirdParty: string[] = [];
  page.on("request", (request) => {
    if (/googletagmanager|google-analytics|facebook\.net/.test(request.url())) {
      thirdParty.push(request.url());
    }
  });
  for (const path of [
    "/",
    "/tour-packages/maldives-island-stay",
    "/shop/p/better-day-ce505a-cf280a-black-toner",
  ]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
  }
  expect(errors.filter((error) => /Content Security Policy|Refused to/i.test(error))).toEqual([]);
  expect(thirdParty).toEqual([]);
  // No analytics IDs in Settings › Tracking → no consent bar.
  await expect(page.getByRole("region", { name: "Cookie consent" })).toHaveCount(0);
});
