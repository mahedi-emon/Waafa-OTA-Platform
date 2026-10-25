import { describe, expect, it } from "vitest";
import { expectedFiles } from "./expectedFiles";

const key = `cf_${"a".repeat(32)}`;

describe("expectedFiles (issue 232)", () => {
  it("reads visa documents, attachments, a payment slip and a feedback photo", () => {
    expect(
      expectedFiles({
        module: "visa",
        documents: [
          { kind: "passport-bio", fileName: "passport.jpg", storageKey: key },
          { kind: "photo", fileName: "photo.png" },
        ],
      }),
    ).toEqual([
      { kind: "passport-bio", fileName: "passport.jpg", storageKey: key },
      { kind: "photo", fileName: "photo.png" },
    ]);
    expect(expectedFiles({ module: "printing", attachments: [{ fileName: "brief.pdf" }] })).toEqual(
      [{ kind: "other", fileName: "brief.pdf" }],
    );
    expect(
      expectedFiles({ method: "offline", proof: { kind: "payment-proof", fileName: "slip.jpg" } }),
    ).toEqual([{ kind: "payment-proof", fileName: "slip.jpg" }]);
    expect(expectedFiles({ kind: "photo", fileName: "trip.jpg", storageKey: key })).toEqual([
      { kind: "photo", fileName: "trip.jpg", storageKey: key },
    ]);
  });

  it("skips anything that is not a file reference", () => {
    expect(
      expectedFiles(null, undefined, "x", { method: "cod" }, { documents: [1, null, {}] }),
    ).toEqual([]);
  });
});
