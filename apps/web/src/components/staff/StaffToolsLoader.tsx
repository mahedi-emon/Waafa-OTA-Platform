"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { hasStaffHint } from "@/lib/staffHint";

const StaffTools = dynamic(() => import("./StaffTools").then((module) => module.StaffTools), {
  ssr: false,
});

const subscribe = () => () => {};

/** A browser where staff signed in, outside the admin's own preview frames. */
function isStaffBrowser(): boolean {
  return window.self === window.top && hasStaffHint(document.cookie);
}

/**
 * Loads the public site's staff tools (D0 R7) only where staff signed in: the sign-in leaves a readable hint cookie
 * that grants nothing. Visitors get this small file and nothing more; the tools, their words and links come only to
 * a signed-in browser.
 */
function StaffToolsLoader() {
  const staff = useSyncExternalStore(subscribe, isStaffBrowser, () => false);
  return staff ? <StaffTools /> : null;
}

export { StaffToolsLoader };
