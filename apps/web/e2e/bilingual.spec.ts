import { expect, test } from "@playwright/test";

/*
 * Bilingual content (issue 255): a record's Bangla text shows on /bn pages; records without Bangla show their English
 * there, and English pages never change.
 */
test("a FAQ shows its Bangla on /bn and English elsewhere; others fall back to English", async ({
  page,
}) => {
  await page.goto("/bn/faqs");
  await expect(page.getByText("WAAFA-তে কীভাবে ফ্লাইট বুক করব?")).toBeVisible();
  // No Bangla written for this one yet: the English shows instead of a blank.
  await expect(page.getByText("Can I change or cancel my ticket?")).toBeVisible();
  await page.goto("/faqs");
  await expect(page.getByText("How do I book a flight with WAAFA?")).toBeVisible();
  await expect(page.getByText("WAAFA-তে কীভাবে ফ্লাইট বুক করব?")).toHaveCount(0);
});
