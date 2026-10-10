"use client";

import { createContext, useContext } from "react";
import type { JsonSchema, Path } from "@/lib/admin/schema";

export type SchemaEditorStrings = {
  addItem: string;
  removeItem: string;
  itemUp: string;
  itemDown: string;
  optional: string;
  unset: string;
  setValue: string;
  clear: string;
  choose: string;
  variant: string;
  emptyList: string;
  jsonInvalid: string;
  yes: string;
  no: string;
};

export type SchemaEditorContextValue = {
  root: JsonSchema;
  /** Field errors from the API, keyed by dotted path ("seo.title", "items.2.price"). */
  errors: Record<string, string>;
  strings: SchemaEditorStrings;
  change: (path: Path, value: unknown) => void;
};

export const SchemaEditorContext = createContext<SchemaEditorContextValue | null>(null);

export function useSchemaEditor(): SchemaEditorContextValue {
  const value = useContext(SchemaEditorContext);
  if (!value) throw new Error("useSchemaEditor needs a SchemaEditorContext provider");
  return value;
}
