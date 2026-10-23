"use client";

import { useMemo } from "react";
import { useStoredValue } from "../useStoredValue";

export type SavedView = { name: string; query: string };

const parse = <T>(text: string, fallback: T): T => {
  try {
    const value = JSON.parse(text) as unknown;
    return Array.isArray(value) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
};

/**
 * A person's saved views and hidden columns for one list, kept on this device (D0 R5, D227): views are the list's
 * address (search, filters, sort), so opening one is a plain link.
 */
export function useListPreferences(listKey: string) {
  const [viewsText, setViewsText] = useStoredValue(`waafa.admin.views.${listKey}`, "[]");
  const [hiddenText, setHiddenText] = useStoredValue(`waafa.admin.columns.${listKey}`, "[]");
  const views = parse<SavedView[]>(viewsText, []).filter(
    (view) => typeof view?.name === "string" && typeof view?.query === "string",
  );
  // One Set per stored value, so the table's memoised columns and rows hold between renders.
  const hidden = useMemo(
    () => new Set(parse<string[]>(hiddenText, []).filter((key) => typeof key === "string")),
    [hiddenText],
  );

  return {
    views,
    saveView: (name: string, query: string) =>
      setViewsText(
        JSON.stringify([...views.filter((view) => view.name !== name), { name, query }].slice(-12)),
      ),
    deleteView: (name: string) =>
      setViewsText(JSON.stringify(views.filter((view) => view.name !== name))),
    hidden,
    toggleColumn: (key: string) => {
      const next = new Set(hidden);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      setHiddenText(JSON.stringify([...next]));
    },
  };
}
