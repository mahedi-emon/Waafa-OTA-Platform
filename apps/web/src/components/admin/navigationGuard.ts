"use client";

/*
 * The unsaved-changes guard for navigations the page makes itself (Ctrl K, the + New menu): an editor with unsaved
 * work registers a handler that asks first (D0 R2). Link clicks are caught by the editor's own listener.
 */

type Guard = (href: string) => boolean;

let guard: Guard | null = null;

/** An editor registers while it has unsaved changes; the handler returns true when it took over (asked first). */
export function setNavigationGuard(next: Guard | null): void {
  guard = next;
}

/** Navigates unless an editor with unsaved changes wants to ask first. */
export function guardedNavigate(href: string, navigate: (href: string) => void): void {
  if (guard?.(href)) return;
  navigate(href);
}
