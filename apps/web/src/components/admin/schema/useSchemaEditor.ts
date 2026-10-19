"use client";

import { createContext, useContext } from "react";
import type { ResolvedBlueprint, ResolvedField } from "@/lib/admin/blueprints/types";
import type { FieldError } from "@/lib/admin/blueprints/validate";
import type { JsonSchema, Path } from "@/lib/admin/schema";

export type SchemaEditorContextValue = {
  root: JsonSchema;
  blueprint: ResolvedBlueprint;
  /** The whole record, for fields that read their neighbours (a slug follows the title). */
  value: unknown;
  /** Problems by dotted path ("prices.2.price"), from the form's own checks and the API. */
  errors: ReadonlyMap<string, FieldError>;
  change: (path: Path, value: unknown) => void;
  /** Changes a value from its latest state (Undo after other edits, list moves). */
  update: (path: Path, change: (current: unknown) => unknown) => void;
  /** A field lost focus: check it now (validate on blur). */
  touch: (path: Path) => void;
  /** The record hasn't been saved yet. */
  isNew: boolean;
  /** The record is live on the site (its link should not change lightly). */
  live: boolean;
  /** The public site's address, for full links ("https://waafasworld.com"). */
  origin: string;
  /** A slug still follows its title (new records until staff edit the link). */
  slugFollows: (pattern: string) => boolean;
};

export const SchemaEditorContext = createContext<SchemaEditorContextValue | null>(null);

export function useSchemaEditor(): SchemaEditorContextValue {
  const value = useContext(SchemaEditorContext);
  if (!value) throw new Error("useSchemaEditor needs a SchemaEditorContext provider");
  return value;
}

/** The resolved field for a pattern, or a plain fallback for anything the blueprint doesn't know. */
export function fieldAt(
  blueprint: ResolvedBlueprint,
  pattern: string,
  fallback: string,
): ResolvedField {
  return blueprint.fields[pattern] ?? { label: fallback, widget: "json" };
}
