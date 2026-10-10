import { CONTENT_MODEL } from "@waafa/shared";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  defaultFor,
  discriminatorOf,
  fromLocalInput,
  getAt,
  isLongText,
  isNullable,
  resolve,
  setAt,
  summaryOf,
  toLocalInput,
  typeOf,
  unionOf,
  type JsonSchema,
} from "./schema";

const toSchema = (schema: z.ZodType) =>
  z.toJSONSchema(schema, { io: "input", unrepresentable: "any" }) as JsonSchema;

describe("content editor schema helpers (D138)", () => {
  it("builds a valid empty record for every content collection", () => {
    for (const [key, entry] of Object.entries(CONTENT_MODEL)) {
      const schema = toSchema(entry.schema);
      const value = defaultFor(schema, schema);
      expect(value, key).toBeDefined();
    }
  });

  it("finds the discriminator of a union of objects", () => {
    const schema = toSchema(
      z.discriminatedUnion("method", [
        z.object({ method: z.literal("cod") }),
        z.object({ method: z.literal("offline"), accountId: z.string() }),
      ]),
    );
    const union = unionOf(schema, schema);
    expect(union?.nullable).toBe(false);
    expect(discriminatorOf(union?.options ?? [])).toBe("method");
    expect(defaultFor(schema, schema)).toEqual({ method: "cod" });
  });

  it("treats a nullable field as a union with null", () => {
    const schema = toSchema(z.object({ note: z.string().nullable() }));
    const note = resolve(schema.properties?.note ?? {}, schema);
    expect(isNullable(note, schema)).toBe(true);
    expect(typeOf(note)).toBe("string");
  });

  it("reads and writes nested values without mutating", () => {
    const before = { a: { list: [{ x: 1 }, { x: 2 }] } };
    const after = setAt(before, ["a", "list", 1, "x"], 5);
    expect(getAt(after, ["a", "list", 1, "x"])).toBe(5);
    expect(before.a.list[1]?.x).toBe(2);
    expect(setAt({ a: 1, b: 2 }, ["b"], undefined)).toEqual({ a: 1 });
  });

  it("names list items and picks textareas for long text", () => {
    expect(summaryOf({ id: "x", title: "Bangkok in 5 days" })).toBe("Bangkok in 5 days");
    expect(summaryOf({ question: "Is VAT included?" })).toBe("Is VAT included?");
    expect(isLongText({ type: "string", maxLength: 1200 }, "answer")).toBe(true);
    expect(isLongText({ type: "string", maxLength: 80 }, "title")).toBe(false);
    expect(isLongText({ type: "string" }, "description")).toBe(true);
  });

  it("edits times in Asia/Dhaka", () => {
    expect(toLocalInput("2026-10-11T13:18:00.000Z")).toBe("2026-10-11T19:18");
    expect(fromLocalInput("2026-10-11T19:18")).toBe("2026-10-11T19:18:00+06:00");
  });
});
