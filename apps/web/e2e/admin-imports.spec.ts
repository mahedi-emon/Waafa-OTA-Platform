import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { collectErrors } from "./errors";
import { whenHydrated } from "./hydration";

/*
 * Invoices, packing slips and CSV import (issue 248): staff print an order's invoice and packing slip, and import
 * printer models from the exported CSV with a preview first. API mode only; own data per run.
 */
const API = process.env.WAAFA_API_URL ?? "";
const INTAKE_KEY = process.env.WAAFA_INTAKE_KEY ?? "";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "owner@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";

test.skip(!API || !INTAKE_KEY || !ADMIN_PASSWORD, "API mode with the seed Super Admin only");
test.describe.configure({ mode: "serial" });

const STAMP = String(Date.now()).slice(-6);

async function signIn(page: Page) {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": "198.51.100.91" });
  await page.goto("/secure-admin-control/sign-in");
  await page.getByLabel("Work email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Hello, / })).toBeVisible();
}

/** A CSV cell as the export writes it. */
const cell = (value: string) => `"${value.replace(/"/g, '""')}"`;

test("an order prints its invoice and packing slip", async ({ page }) => {
  test.setTimeout(90_000);
  const placed = await page.request.post(`${API}/api/v1/public/orders`, {
    headers: {
      "x-intake-key": INTAKE_KEY,
      "idempotency-key": randomUUID(),
      "x-client-ip": "203.0.113.248",
    },
    data: {
      lines: [{ variantId: "pb-20k-blk", quantity: 1 }],
      address: {
        name: `Sample Printer ${STAMP}`,
        phone: `+8801711${STAMP}`,
        division: "Dhaka",
        district: "Dhaka",
        area: "Motijheel",
        street: "House 4, Road 2",
      },
      payment: { method: "cod" },
    },
  });
  expect(placed.ok(), await placed.text()).toBe(true);
  const { reference } = (await placed.json()) as { reference: string };

  await signIn(page);
  const errors = collectErrors(page);
  await page.goto(`/secure-admin-control/orders?q=${reference}`);
  await page
    .getByRole("link", { name: new RegExp(`Sample Printer ${STAMP}`) })
    .first()
    .click();
  await expect(page.getByRole("heading", { level: 1, name: reference })).toBeVisible();
  for (const [name, title] of [
    ["Invoice (PDF)", "Invoice"],
    ["Packing slip (PDF)", "Packing slip"],
  ] as const) {
    const link = page.getByRole("link", { name });
    const href = await link.getAttribute("href");
    expect(href).toMatch(
      /^\/secure-admin-control\/api\/orders\/[a-z0-9]+\/(invoice|packing-slip)$/,
    );
    const pdf = await page.request.get(href!);
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()["content-type"]).toBe("application/pdf");
    expect((await pdf.body()).toString("latin1")).toContain(`(${title} ${reference})`);
  }
  expect(errors).toEqual([]);
});

test("printer models import from the exported CSV after a preview", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await signIn(page);
  const errors = collectErrors(page);
  await page.goto("/secure-admin-control/content/compatibleModels");

  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download CSV to edit" }).click();
  const file = await (await download).path();
  const exported = await readFile(file, "utf8");
  const lines = exported.replace(/^﻿/, "").split("\r\n");
  expect(lines[0]).toBe('"id","brand","model","part_codes"');

  // One model renamed, one added; the rest unchanged.
  const first = lines[1]!.split('","');
  first[2] = `Edited model ${STAMP}`;
  const edited = [
    lines[0],
    first.join('","'),
    ...lines.slice(2),
    [`e2e-model-${STAMP}`, "Canon", `imageCLASS ${STAMP}`, "CRG-071"].map(cell).join(","),
  ].join("\r\n");
  const upload = testInfo.outputPath("models.csv");
  await writeFile(upload, `﻿${edited}`);

  const open = page.getByRole("button", { name: "Import CSV" });
  await whenHydrated(open);
  await open.click();
  const dialog = page.getByRole("dialog", { name: "Import from a CSV file" });
  await dialog.getByLabel("CSV file", { exact: true }).setInputFiles(upload);
  await expect(
    dialog.getByText(/1 to add · 1 to change · \d+ unchanged · 0 with problems/),
  ).toBeVisible();
  await expect(dialog.getByRole("cell", { name: `e2e-model-${STAMP}` })).toBeVisible();
  await expect(dialog.getByText("Changes: model")).toBeVisible();
  const axe = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  expect(axe.violations).toEqual([]);

  await dialog.getByRole("button", { name: "Import changes (2)" }).click();
  await expect(page.getByText("Imported: 1 added, 1 changed")).toBeVisible();
  await expect(dialog).toHaveCount(0);
  await page.goto(`/secure-admin-control/content/compatibleModels?q=${STAMP}`);
  await expect(
    page.getByRole("link", { name: new RegExp(`imageCLASS ${STAMP}`) }).first(),
  ).toBeVisible();

  // A file with a problem can't be imported.
  const broken = testInfo.outputPath("broken.csv");
  await writeFile(
    broken,
    `${lines[0]}\r\n${[`e2e-bad-${STAMP}`, "HP", "", ""].map(cell).join(",")}`,
  );
  await page.getByRole("button", { name: "Import CSV" }).click();
  await dialog.getByLabel("CSV file", { exact: true }).setInputFiles(broken);
  await expect(dialog.getByText(/^model: /)).toBeVisible();
  await expect(dialog.getByRole("button", { name: /^Import changes/ })).toBeDisabled();
  expect(errors).toEqual([]);
});
