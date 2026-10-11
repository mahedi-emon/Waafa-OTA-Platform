import { describe, expect, it } from "vitest";
import { z } from "zod";
import { looksLikeEmail } from "./looksLikeEmail";

const SAMPLES = [
  "reader@example.com",
  "first.last+tag@mail.example.co.bd",
  "o'neil@example.org",
  "a@b.co",
  "",
  "plain",
  "@example.com",
  "reader@",
  "reader@example",
  ".reader@example.com",
  "re..ader@example.com",
  "reader.@example.com",
  "reader@-example.com",
  "reader@example.c",
  "reader @example.com",
  "reader@exa mple.com",
];

describe("looksLikeEmail", () => {
  it.each(SAMPLES)("agrees with z.email() on %j", (value) => {
    expect(looksLikeEmail(value)).toBe(z.email().safeParse(value).success);
  });
});
