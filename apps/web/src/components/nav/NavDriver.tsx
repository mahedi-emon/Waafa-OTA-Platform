"use client";

import { startTransition, useEffect } from "react";
import { useRouter } from "next/navigation";

/** The `a[data-nav]` link an event happened in, when it is a same-site page the router can open. */
function navLink(target: EventTarget | null): { anchor: HTMLAnchorElement; href: string } | null {
  const anchor =
    target instanceof Element ? target.closest<HTMLAnchorElement>("a[data-nav]") : null;
  if (!anchor || anchor.hasAttribute("download")) return null;
  if (anchor.target && anchor.target !== "_self") return null;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  return { anchor, href: `${url.pathname}${url.search}${url.hash}` };
}

/**
 * Client-side navigation for the plain links Server Components render (`LocalLink`, issue 236): one click listener
 * opens them with the router (no full reload), and pages are fetched ahead when a pointer hovers, a finger touches or
 * the keyboard focuses a link. Modified clicks (new tab, new window, download) stay with the browser.
 */
function NavDriver() {
  const router = useRouter();

  useEffect(() => {
    const fetched = new Set<string>();

    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = navLink(event.target);
      if (!link) return;
      event.preventDefault();
      const scroll = link.anchor.dataset.navScroll !== "false";
      // In a transition, as next/link does, so shared-element morphs (CardMorph, issue 256) can run.
      startTransition(() => {
        if (link.anchor.hasAttribute("data-nav-replace")) router.replace(link.href, { scroll });
        else router.push(link.href, { scroll });
      });
    };

    const ahead = (event: Event) => {
      const link = navLink(event.target);
      if (!link || link.anchor.dataset.navPrefetch === "false") return;
      const page = link.href.split("#")[0] ?? link.href;
      if (fetched.has(page)) return;
      fetched.add(page);
      router.prefetch(page);
    };

    document.addEventListener("click", click);
    document.addEventListener("pointerover", ahead, { passive: true });
    document.addEventListener("touchstart", ahead, { passive: true });
    document.addEventListener("focusin", ahead);
    return () => {
      document.removeEventListener("click", click);
      document.removeEventListener("pointerover", ahead);
      document.removeEventListener("touchstart", ahead);
      document.removeEventListener("focusin", ahead);
    };
  }, [router]);

  return null;
}

export { NavDriver };
