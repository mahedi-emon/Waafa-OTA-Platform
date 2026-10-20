import { describe, expect, it } from "vitest";
import { nextToStart, retried, type UploadItem } from "./uploadQueue";

const item = (
  key: string,
  status: UploadItem["status"],
  extra: Partial<UploadItem> = {},
): UploadItem => ({
  key,
  file: new File(["x"], `${key}.jpg`, { type: "image/jpeg" }),
  preview: null,
  progress: 0,
  status,
  ...extra,
});

describe("upload queue (D0 R3)", () => {
  it("sends two files at a time, oldest first", () => {
    const waiting = [item("a", "waiting"), item("b", "waiting"), item("c", "waiting")];
    expect(nextToStart(waiting).map((next) => next.key)).toEqual(["a", "b"]);
    expect(
      nextToStart([item("a", "uploading"), item("b", "waiting"), item("c", "waiting")]).map(
        (next) => next.key,
      ),
    ).toEqual(["b"]);
    expect(
      nextToStart([item("a", "uploading"), item("b", "uploading"), item("c", "waiting")]),
    ).toEqual([]);
    // Finished and failed files don't hold a place.
    expect(
      nextToStart([item("a", "done"), item("b", "failed"), item("c", "waiting")]).map(
        (next) => next.key,
      ),
    ).toEqual(["c"]);
  });

  it("retries a failed file from the start, in the same place", () => {
    const failed = item("a", "failed", {
      progress: 0.4,
      problem: "offline",
      tag: "webm",
      preview: "blob:a",
    });
    expect(retried(failed)).toEqual({
      key: "a",
      file: failed.file,
      tag: "webm",
      preview: "blob:a",
      progress: 0,
      status: "waiting",
    });
  });
});
