"use client";

import { useEffect, useState } from "react";
import { Circle, CircleAlert, CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import type { ResolvedSection } from "@/lib/admin/blueprints/types";
import { scrollToSection } from "./scrollToSection";

export type SectionState = "complete" | "attention" | "open";

type EditorSectionRailProps = {
  sections: ResolvedSection[];
  /** Per section id: complete, needs attention (a problem), or still open. */
  states: Record<string, SectionState>;
};

const ICON = { complete: CircleCheck, attention: CircleAlert, open: Circle } as const;

/**
 * The editor's sections as a sticky list from 1024 px, with a tick for complete ones and a mark where something
 * needs attention; the section in view is highlighted (ADMIN.md §5.4).
 */
function EditorSectionRail({ sections, states }: EditorSectionRailProps) {
  const t = useTranslations("Admin.editor.rail");
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const targets = sections
      .map((section) => document.getElementById(`section-${section.id}`))
      .filter((node): node is HTMLElement => node !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id.replace(/^section-/, ""));
      },
      { rootMargin: "-96px 0px -55% 0px" },
    );
    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, [sections]);

  if (sections.length < 2) return null;

  return (
    <nav aria-label={t("title")} className="sticky top-20">
      <p className="mb-2 px-2 text-[12px] font-semibold tracking-wide text-mist-500 uppercase">
        {t("title")}
      </p>
      <ol className="flex flex-col gap-0.5">
        {sections.map((section) => {
          const state = states[section.id] ?? "open";
          const Icon = ICON[state];
          const current = active === section.id;
          return (
            <li key={section.id}>
              <a
                href={`#section-${section.id}`}
                aria-current={current ? "location" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection(section.id);
                }}
                className={cn(
                  "flex min-h-10 items-center gap-2.5 rounded-lg px-2 text-[14px] transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                  current
                    ? "bg-white font-semibold text-navy-900 shadow-xs"
                    : "text-mist-700 hover:bg-white/70",
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn(
                    "size-4 shrink-0",
                    state === "complete" && "text-success-700",
                    state === "attention" && "text-danger-700",
                    state === "open" && "text-mist-400",
                  )}
                />
                <span className="min-w-0 truncate">{section.title}</span>
                {state !== "open" ? (
                  <span className="sr-only">
                    {state === "complete" ? t("complete") : t("attention")}
                  </span>
                ) : null}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export { EditorSectionRail };
