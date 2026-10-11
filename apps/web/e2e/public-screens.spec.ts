import { expect, test } from "@playwright/test";
import { collectErrors } from "./errors";

/*
 * A22 QA (#22): every public route at 320, 390, 768, 1024 and 1440 px: no horizontal scroll and no console errors,
 * with a full-page screenshot at 390 and 1440 for the design review against the board thumbnails
 * (docs/design/thumbs/<board>.jpg). The CI job uploads test-results/public-shots. Reduced motion for stable shots.
 */
const WIDTHS = [320, 390, 768, 1024, 1440] as const;
const SHOT_WIDTHS = new Set<number>([390, 1440]);

/** Route → the board it is reviewed against (the phone board is the same name with -m). */
const ROUTES: Array<{ name: string; path: string }> = [
  { name: "Home", path: "/" },
  { name: "Flights", path: "/flights" },
  { name: "GroupFares", path: "/flights/group-fares" },
  { name: "Hotels", path: "/hotels" },
  { name: "Packages", path: "/tour-packages" },
  { name: "PackageDetail", path: "/tour-packages/maldives-island-stay" },
  { name: "PlanTrip", path: "/plan-my-trip" },
  { name: "Visa", path: "/visa-services" },
  { name: "VisaCountry", path: "/visa-services/thailand" },
  { name: "VisaApply", path: "/visa-services/thailand/apply" },
  { name: "VisaGuide", path: "/visa-guide" },
  { name: "VisaGuidePost", path: "/visa-guide/malaysia-evisa-step-by-step" },
  { name: "Shop", path: "/shop" },
  { name: "ShopCats", path: "/shop/categories" },
  { name: "ShopList", path: "/shop/c/office-and-stationery" },
  { name: "ShopProduct", path: "/shop/p/better-day-ce505a-cf280a-black-toner" },
  { name: "ShopDeals", path: "/shop/deals" },
  { name: "ShopFinder", path: "/shop/finder" },
  { name: "ShopCart", path: "/shop/cart" },
  { name: "ShopTrack", path: "/shop/track" },
  { name: "Printing", path: "/shop/printing-solutions" },
  { name: "Trading", path: "/shop/international-trading" },
  { name: "Gallery", path: "/gallery" },
  { name: "Feedback", path: "/feedback" },
  { name: "About", path: "/about-us" },
  { name: "Contact", path: "/contact" },
  { name: "Faqs", path: "/faqs" },
  { name: "Blog", path: "/blog" },
  { name: "Emi", path: "/emi" },
  { name: "OfflinePay", path: "/offline-payment" },
  { name: "Baggage", path: "/baggage-information" },
  { name: "Error", path: "/no-such-page" },
];

test.skip(!process.env.PUBLIC_SHOTS, "Runs in the CI screenshots step (PUBLIC_SHOTS=1)");
test.use({ reducedMotion: "reduce" });

for (const route of ROUTES) {
  test(`${route.name} holds every width`, async ({ page }) => {
    test.setTimeout(120_000);
    const errors = collectErrors(page);
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      await page.goto(route.path, { waitUntil: "networkidle" });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `${route.path} has no horizontal scroll at ${width}`).toBeLessThanOrEqual(0);
      if (SHOT_WIDTHS.has(width)) {
        await page.screenshot({
          path: `test-results/public-shots/${route.name}${width === 390 ? "-m" : ""}.png`,
          fullPage: true,
        });
      }
    }
    // The 404 board answers 404 on purpose; everything else stays error-free.
    if (route.name !== "Error") expect(errors).toEqual([]);
  });
}
