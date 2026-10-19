import { describe, expect, it } from "vitest";
import { CONTENT_KEYS, CONTENT_MODEL, isPickerKey, type ContentKey } from "@waafa/shared";
import messages from "../../../../messages/en.json";
import { editorSchema } from "../editorSchema";
import { buildResolvedBlueprint, type Words } from "./build";
import { BLUEPRINTS } from "./registry";
import { walkSchema } from "./walk";

const admin = (messages as { Admin: Record<string, unknown> }).Admin;

/** The message at a dotted path under Admin, if it is a string. */
const words: Words = (key) => {
  let current: unknown = admin;
  for (const part of key.split(".")) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
};

/** Brand names spelled with inner capitals, which are right as they are. */
const BRANDS = /LinkedIn|WhatsApp|YouTube|TikTok|bKash|SSLCommerz|WebM/g;

/** Words staff read: start with a capital or a digit, no code-style names, no "ID". */
const plain = (text: string) => {
  const words = text.replace(BRANDS, "Brand");
  return (
    /^[A-Z0-9৳"(]/.test(words) &&
    !/[a-z][A-Z]/.test(words) &&
    !/_/.test(words) &&
    !/\bI[Dd]s?\b/.test(words)
  );
};

describe("form engine v2 blueprints (D0 R2)", () => {
  it("has one blueprint for every content key", () => {
    expect(Object.keys(BLUEPRINTS).sort()).toEqual([...CONTENT_KEYS].sort());
    for (const key of CONTENT_KEYS) expect(BLUEPRINTS[key].key).toBe(key);
  });

  describe.each(CONTENT_KEYS.map((key) => [key] as [ContentKey]))("%s", (key) => {
    const schema = editorSchema(key);
    const infos = walkSchema(schema);
    const patterns = new Set(infos.map((info) => info.pattern));
    const topLevel = new Set(infos.filter((info) => info.parent === "").map((info) => info.name));
    const blueprint = BLUEPRINTS[key];
    const resolved = buildResolvedBlueprint(key, schema, words);
    /** Widgets that draw a whole group themselves (a picked airline, a read-only value). */
    const ownsChildren = new Set(["reference", "references", "readOnly", "map"]);
    /** A field is on screen when neither it nor a group around it is hidden or drawn as one piece. */
    const shown = (pattern: string): boolean => {
      const info = infos.find((candidate) => candidate.pattern === pattern);
      if (!info) return false;
      if (resolved.fields[pattern]?.hidden) return false;
      if (info.parent === null || info.parent === "") return true;
      const parent = resolved.fields[info.parent];
      if (parent && ownsChildren.has(parent.widget)) return false;
      return shown(info.parent);
    };

    it("names only fields the schema has", () => {
      const unknown = [
        ...Object.keys(blueprint.fields ?? {}).filter((pattern) => !patterns.has(pattern)),
        ...blueprint.sections
          .flatMap((section) => section.fields)
          .filter((name) => name !== "" && !topLevel.has(name)),
        ...(blueprint.visibility ?? []).filter((name) => !topLevel.has(name)),
        ...(blueprint.publish ?? []).filter((pattern) => !patterns.has(pattern)),
      ];
      expect(unknown).toEqual([]);
      for (const spec of Object.values(blueprint.fields ?? {})) {
        if (!spec.ref) continue;
        expect(CONTENT_MODEL[spec.ref.key].kind).toBe("collection");
        // The API lets every staff member read a picker's choices only for these lists.
        expect(isPickerKey(spec.ref.key)).toBe(true);
      }
    });

    it("names a field like its section only when it is the section's one field", () => {
      // That field's label is for screen readers only (useQuietLabel) and a group named like it draws bare; next to
      // other fields the name would read twice ("Question" in Question).
      const repeated = resolved.sections.flatMap((section) => {
        const fields = section.fields.filter((name) => name !== "" && shown(name));
        if (fields.length < 2) return [];
        return fields
          .filter((name) => resolved.fields[name]?.widget !== "group")
          .filter((name) => resolved.fields[name]?.label === section.title)
          .map((name) => `${section.id}.${name}: ${section.title}`);
      });
      expect(repeated).toEqual([]);
    });

    it("lets staff reach every required field (or fills it in)", () => {
      const placed = new Set([
        ...blueprint.sections.flatMap((section) => section.fields),
        ...(blueprint.visibility ?? []),
      ]);
      const unreachable = infos
        .filter((info) => info.parent === "" && info.name !== "item" && info.required)
        .filter((info) => !placed.has(info.name) && !resolved.fields[info.pattern]?.hidden)
        .map((info) => info.name);
      expect(unreachable).toEqual([]);
      // Nothing is left for Advanced: every field has a place, so only the Super Admin's JSON view goes beyond it.
      expect(resolved.advanced).toEqual([]);
    });

    it("has plain words for the record, its sections, fields and choices", () => {
      const missing: string[] = [];
      const base = `blueprints.${key}`;
      for (const name of ["one", "other", "intro"])
        if (!words(`${base}.${name}`)) missing.push(`${base}.${name}`);
      for (const section of blueprint.sections)
        if (!words(`${base}.sections.${section.id}`))
          missing.push(`${base}.sections.${section.id}`);
      for (const info of infos) {
        if (info.pattern === "" || !shown(info.pattern)) continue;
        if (!words(`${base}.fields.${info.pattern}`) && !words(`fieldNames.${info.name}`))
          missing.push(`fieldNames.${info.name} (${info.pattern})`);
        const set = blueprint.fields?.[info.pattern]?.choices ?? info.name;
        for (const value of info.values ?? [])
          if (!words(`choices.${set}.${value}`)) missing.push(`choices.${set}.${value}`);
      }
      expect(missing).toEqual([]);

      const awkward = Object.entries(resolved.fields)
        .filter(([pattern]) => shown(pattern))
        .flatMap(([pattern, field]) => [
          ...(plain(field.label) ? [] : [`${pattern}: ${field.label}`]),
          ...(field.choices ?? [])
            .filter((choice) => !plain(choice.label))
            .map((choice) => `${pattern}.${choice.value}: ${choice.label}`),
        ]);
      expect(awkward).toEqual([]);
    });
  });
});
