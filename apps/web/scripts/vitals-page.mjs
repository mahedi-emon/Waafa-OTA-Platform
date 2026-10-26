/* eslint-disable no-console -- a command-line tool that prints its report */
// Developer tool (issue 236): loads a page on a 390 px phone with 4x CPU and a slow-4G-like network, then prints
// first paint, FCP, every LCP candidate (element, load and render time), long tasks and CLS. Usage:
//   node scripts/vitals-page.mjs http://localhost:3200/ [cpuRate]
import { chromium } from "@playwright/test";

const url = process.argv[2] ?? "http://localhost:3200/";
const rate = Number(process.argv[3] ?? 4);
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
await context.addInitScript(() => {
  window.__vitals = { lcp: [], long: [], cls: 0 };
  new PerformanceObserver((list) => {
    for (const e of list.getEntries())
      window.__vitals.lcp.push({
        start: Math.round(e.startTime),
        load: Math.round(e.loadTime),
        render: Math.round(e.renderTime),
        size: e.size,
        el: e.element
          ? `${e.element.tagName.toLowerCase()} ${(e.element.getAttribute("alt") || e.element.textContent || "").slice(0, 50)}`
          : "?",
      });
  }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((list) => {
    for (const e of list.getEntries())
      window.__vitals.long.push([Math.round(e.startTime), Math.round(e.duration)]);
  }).observe({ type: "longtask", buffered: true });
  window.__vitals.shifts = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (e.hadRecentInput) continue;
      window.__vitals.cls += e.value;
      window.__vitals.shifts.push(
        `${Math.round(e.startTime)} ${e.value.toFixed(3)} ` +
          (e.sources ?? [])
            .map((s) =>
              s.node instanceof Element
                ? `${s.node.tagName.toLowerCase()}.${String(s.node.className).slice(0, 60)}`
                : "#text",
            )
            .join(" | "),
      );
    }
  }).observe({ type: "layout-shift", buffered: true });
});
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate });
await cdp.send("Network.enable");
await cdp.send("Network.emulateNetworkConditions", {
  offline: false,
  latency: 150,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
});
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(5000);
const result = await page.evaluate(() => ({
  paint: performance.getEntriesByType("paint").map((p) => `${p.name} ${Math.round(p.startTime)}`),
  nav: (() => {
    const n = performance.getEntriesByType("navigation")[0];
    return `ttfb ${Math.round(n.responseStart)} domInteractive ${Math.round(n.domInteractive)} dcl ${Math.round(n.domContentLoadedEventEnd)} load ${Math.round(n.loadEventEnd)}`;
  })(),
  ...window.__vitals,
}));
await browser.close();
console.log(result.nav);
console.log(result.paint.join(" | "));
for (const c of result.lcp)
  console.log(`LCP candidate @${c.start} load ${c.load} render ${c.render} size ${c.size} ${c.el}`);
const tbt = result.long
  .filter(([start]) => start > 0)
  .reduce((sum, [, d]) => sum + Math.max(0, d - 50), 0);
console.log(
  `long tasks ${result.long.length}: ${result.long.map(([s, d]) => `${s}+${d}`).join(" ")}  (blocking ${tbt} ms)`,
);
console.log(`CLS ${result.cls.toFixed(3)}`);
for (const shift of result.shifts) console.log(`  shift ${shift}`);
