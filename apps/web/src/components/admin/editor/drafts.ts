"use client";

import { useSyncExternalStore } from "react";

/*
 * Unsaved work kept on this device (D0 R2, ADMIN.md §9): the editor writes a draft a moment after each change and
 * offers it back after a reload, a crash or a new sign-in. Drafts are per record and per browser, never sent anywhere.
 */

export type Draft = {
  value: unknown;
  /** The record version the draft was typed on. */
  baseVersion?: number;
  /** When it was kept (ms since 1970). */
  savedAt: number;
};

const PREFIX = "waafa-admin-draft:v1:";
/** Drafts older than this are dropped on read. */
const KEEP_FOR = 14 * 24 * 60 * 60_000;
/** Very large records aren't kept (local storage is small). */
const MAX_BYTES = 400_000;

export const draftKey = (contentKey: string, recordId: string) =>
  `${PREFIX}${contentKey}:${recordId}`;

export function readDraft(key: string): Draft | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Draft;
    if (typeof draft.savedAt !== "number" || Date.now() - draft.savedAt > KEEP_FOR) {
      window.localStorage.removeItem(key);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

/** Keeps a draft; false when the browser refused (private mode, full storage) or it is too large. */
export function writeDraft(key: string, draft: Draft): boolean {
  try {
    const raw = JSON.stringify(draft);
    if (raw.length > MAX_BYTES) return false;
    window.localStorage.setItem(key, raw);
    return true;
  } catch {
    return false;
  }
}

export function clearDraft(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to clear when storage is blocked.
  }
}

/** The draft as it was when this editor opened (later autosaves don't change it). */
const atLoad = new Map<string, Draft | null>();
const noop = () => () => {};

export function useDraftAtLoad(key: string, instance: string): Draft | null {
  const id = `${key}#${instance}`;
  return useSyncExternalStore(
    noop,
    () => {
      if (!atLoad.has(id)) atLoad.set(id, readDraft(key));
      return atLoad.get(id) ?? null;
    },
    () => null,
  );
}
