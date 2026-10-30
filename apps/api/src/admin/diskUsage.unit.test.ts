import { linkSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { folderBytes } from "./diskUsage";

const root = mkdtempSync(join(tmpdir(), "waafa-disk-"));

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("folderBytes (issue 303)", () => {
  it("adds up the files in a folder and the folders under it", async () => {
    mkdirSync(join(root, "2026", "10"), { recursive: true });
    writeFileSync(join(root, "a.webp"), Buffer.alloc(1000));
    writeFileSync(join(root, "2026", "10", "b.webp"), Buffer.alloc(2500));
    expect(await folderBytes(root)).toBe(3500);
  });

  it("counts a file with several hard links once (issue 332)", async () => {
    const backups = join(root, "backups");
    mkdirSync(backups);
    writeFileSync(join(backups, "waafa-20261029-0315.media.tar.gz"), Buffer.alloc(4000));
    linkSync(
      join(backups, "waafa-20261029-0315.media.tar.gz"),
      join(backups, "waafa-20261030-0315.media.tar.gz"),
    );
    writeFileSync(join(backups, "waafa-20261030-0315.sql.gz"), Buffer.alloc(600));
    expect(await folderBytes(backups)).toBe(4600);
  });

  it("answers null for a folder this container does not have", async () => {
    expect(await folderBytes(join(root, "not-mounted"))).toBeNull();
  });
});
