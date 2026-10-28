import { describe, expect, it } from "vitest";
import { lowResources } from "./resourceAlert";

const GB = 1024 ** 3;

describe("disk and memory alerts (issue 239)", () => {
  it("names what is low in plain words, and nothing while there is room", () => {
    expect(
      lowResources({
        disk: { totalBytes: 80 * GB, freeBytes: 30 * GB },
        memory: { totalBytes: 8 * GB, freeBytes: 2 * GB },
      }),
    ).toEqual([]);
    expect(
      lowResources({
        disk: { totalBytes: 80 * GB, freeBytes: 1.5 * GB },
        memory: { totalBytes: 8 * GB, freeBytes: 0.2 * GB },
      }),
    ).toEqual([
      { what: "disk space", detail: "1.5 GB free of 80.0 GB" },
      { what: "memory", detail: "0.2 GB available of 8.0 GB" },
    ]);
    // Under 10 % free counts too, even with more than 2 GB left on a big disk.
    expect(
      lowResources({
        disk: { totalBytes: 500 * GB, freeBytes: 40 * GB },
        memory: { totalBytes: 8 * GB, freeBytes: 4 * GB },
      }).map((item) => item.what),
    ).toEqual(["disk space"]);
  });
});
