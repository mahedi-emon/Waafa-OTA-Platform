import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Request } from "@playwright/test";
import { collectErrors } from "./errors";

/*
 * Partial lead capture (FR-FLT-08, issue 250): step 1 asks for the OK to be called if the visitor doesn't finish;
 * only with it ticked does the form keep step 1 (name, number, page). The API side (one per phone, completed by the
 * full request, one reminder) is covered by apps/api/test/leadDrafts.test.ts.
 */
test.use({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });

test("step 1 is kept only with the visitor's OK", async ({ page }) => {
  const errors = collectErrors(page);
  const drafts: Request[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/leads/draft")) drafts.push(request);
  });

  await page.goto("/hotels");
  await page.getByLabel("Full name").fill("Sample Karim Ahmed");
  await page.getByLabel("Mobile number").fill("01812-345678");
  const keep = page.getByLabel(/If I don't finish, a travel expert may call me/);
  await expect(keep).not.toBeChecked();
  const axe = await new AxeBuilder({ page })
    .include("#main")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(axe.violations).toEqual([]);

  // Without the OK nothing is kept.
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Check your stay" })).toBeVisible();
  expect(drafts).toHaveLength(0);

  // Back to step 1, tick it, continue: step 1 is kept with the number in international form.
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByLabel(/If I don't finish, a travel expert may call me/).check();
  const sent = page.waitForResponse((response) => response.url().endsWith("/api/leads/draft"));
  await page.getByRole("button", { name: "Continue" }).click();
  expect((await sent).status()).toBe(204);
  expect(drafts).toHaveLength(1);
  expect(drafts[0]!.postDataJSON()).toMatchObject({
    module: "hotels",
    contact: { name: "Sample Karim Ahmed", phone: "+8801812345678" },
    page: "/hotels",
    consent: true,
  });
  expect(errors).toEqual([]);
});

test("the draft endpoint refuses another site's page and missing consent", async ({ request }) => {
  const base = {
    module: "flights",
    contact: { name: "Sample Karim", phone: "+8801812345678" },
    page: "/flights",
    consent: true,
  };
  const headers = { origin: "http://localhost:3100", "content-type": "application/json" };
  const post = (data: unknown) => request.post("/api/leads/draft", { headers, data });
  expect((await post({ ...base, page: "//evil.example" })).status()).toBe(422);
  expect((await post({ ...base, consent: false })).status()).toBe(422);
  expect(
    (
      await request.post("/api/leads/draft", {
        headers: { "sec-fetch-site": "cross-site" },
        data: base,
      })
    ).status(),
  ).toBe(403);
});
