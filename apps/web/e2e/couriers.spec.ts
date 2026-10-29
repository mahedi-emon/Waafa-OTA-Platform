import { expect, test } from "@playwright/test";

/*
 * The courier webhook (issue 253): only known couriers, only with a bearer token, and in this build (no API) nothing
 * is taken. The booking and the token check run against the API in api/test/couriers.test.ts.
 */
test("the courier webhook refuses unknown couriers, missing tokens and bad bodies", async ({
  request,
}) => {
  const url = "/api/couriers/steadfast/webhook";
  expect((await request.post("/api/couriers/pathao-x/webhook", { data: {} })).status()).toBe(404);
  expect(
    (
      await request.post(url, { data: { invoice: "ORD-261104-0007", status: "delivered" } })
    ).status(),
  ).toBe(401);
  const bad = await request.post(url, {
    headers: { authorization: "Bearer some-token", "content-type": "application/json" },
    data: "not json",
  });
  expect(bad.status()).toBe(400);
  const noApi = await request.post(url, {
    headers: { authorization: "Bearer some-token" },
    data: { invoice: "ORD-261104-0007", status: "delivered" },
  });
  expect([401, 503]).toContain(noApi.status());
  expect(await noApi.text()).not.toContain("ORD-261104-0007");
});
