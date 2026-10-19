"use client";

import { createContext, useContext } from "react";

/** A section that holds one field: its title, and the id of that field. */
export type SectionLabel = { title: string; id: string };

export const SectionLabelContext = createContext<SectionLabel | null>(null);

/**
 * True for the only field of a section with the same name ("Delivery zones" in Delivery zones): its label is then for
 * screen readers only, so the name doesn't show twice (ADMIN.md §5.4).
 */
export function useQuietLabel(id: string, label: string): boolean {
  const section = useContext(SectionLabelContext);
  return section !== null && section.id === id && section.title.trim() === label.trim();
}
