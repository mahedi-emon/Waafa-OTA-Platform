/* eslint-disable no-console -- a command-line tool that prints its report */
// Developer tool (issue 236): loads a page on a 390 px phone with 4x CPU throttling and prints where the main thread
// spends its time (self time by function and by script) during the first seconds. Usage:
//   node scripts/profile-page.mjs http://localhost:3200/ [seconds]
import { chromium } from "@playwright/test";

const url = process.argv[2] ?? "http://localhost:3200/";
const seconds = Number(process.argv[3] ?? 6);

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await cdp.send("Profiler.enable");
await cdp.send("Profiler.setSamplingInterval", { interval: 200 });
await cdp.send("Profiler.start");
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(seconds * 1000);
const { profile } = await cdp.send("Profiler.stop");
await browser.close();

const byId = new Map(profile.nodes.map((node) => [node.id, node]));
const self = new Map();
const deltas = profile.timeDeltas;
profile.samples.forEach((id, index) => {
  self.set(id, (self.get(id) ?? 0) + (deltas[index] ?? 0));
});
const byFunction = new Map();
const byScript = new Map();
for (const [id, micros] of self) {
  const frame = byId.get(id).callFrame;
  if (["(idle)", "(program)", "(root)"].includes(frame.functionName)) continue;
  const script = frame.url ? frame.url.split("/").pop() : `(${frame.functionName || "native"})`;
  const key = `${frame.functionName || "(anonymous)"} @ ${script}:${frame.lineNumber}`;
  byFunction.set(key, (byFunction.get(key) ?? 0) + micros);
  byScript.set(script, (byScript.get(script) ?? 0) + micros);
}
const top = (map, count) =>
  [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([key, micros]) => `${String(Math.round(micros / 1000)).padStart(6)} ms  ${key}`)
    .join("\n");
console.log(`Self time by script (4x CPU, ${seconds} s after load):\n${top(byScript, 12)}`);
console.log(`\nSelf time by function:\n${top(byFunction, 30)}`);
const gc = [...self.entries()].filter(
  ([id]) => byId.get(id).callFrame.functionName === "(garbage collector)",
);
console.log(`\nGC ${Math.round(gc.reduce((sum, [, v]) => sum + v, 0) / 1000)} ms`);
