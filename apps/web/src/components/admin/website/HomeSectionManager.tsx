"use client";

import { useState, useTransition, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { StatusChip } from "@/components/admin/StatusChip";
import { SortableList } from "@/components/admin/schema/SortableList";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "@/i18n/navigation";
import { reorderContent, saveRecord } from "@/lib/admin/contentActions";
import { movedOrder } from "@/lib/admin/homeSections";
import { RECORD_CHIPS } from "@/lib/admin/statusChips";
import { HeroSheet } from "./HeroSheet";
import { SectionSheet } from "./SectionSheet";
import { SectionThumb } from "./SectionThumb";
import type { HeroData, ManagedSection } from "./types";

type HomeSectionManagerProps = {
  sections: ManagedSection[];
  hero: HeroData;
  /** Opens one section's editor first (Edit on site links here with ?section=). */
  initialSection: string | null;
};

/**
 * The home page, section by section (ADMIN.md §5.8, D0 R7): each section in page order with a picture of its own
 * content, drag (or Move up / down) to change the order, a switch to show or hide it, and Edit for its words and a
 * preview. The order and the switch save at once; nothing is typed that the system knows.
 */
function HomeSectionManager({ sections, hero, initialSection }: HomeSectionManagerProps) {
  const t = useTranslations("Admin.website");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [order, setOrder] = useState(() => sections.map((section) => section.key as string));
  const [enabled, setEnabled] = useState(
    () => new Map(sections.map((section) => [section.key as string, section.enabled])),
  );
  const [seen, setSeen] = useState(sections);
  const [open, setOpen] = useState<string | null>(initialSection);
  // A refresh from the server brings the saved order and switches.
  if (seen !== sections) {
    setSeen(sections);
    setOrder(sections.map((section) => section.key));
    setEnabled(new Map(sections.map((section) => [section.key as string, section.enabled])));
  }
  const byKey = new Map(sections.map((section) => [section.key as string, section]));
  const ordered = order.flatMap((key) => {
    const section = byKey.get(key);
    return section ? [section] : [];
  });

  const move = (from: number, to: number) => {
    const previous = order;
    const next = movedOrder(order, from, to);
    if (next.join() === previous.join()) return;
    setOrder(next);
    startTransition(async () => {
      const result = await reorderContent("homeSections", next);
      if (!result.ok) {
        setOrder(previous);
        toast.error(t("failed"));
        return;
      }
      toast.success(t("home.orderSaved"));
      router.refresh();
    });
  };

  const toggle = (section: ManagedSection, on: boolean) => {
    setEnabled((current) => new Map(current).set(section.key, on));
    startTransition(async () => {
      const result = await saveRecord(
        "homeSections",
        section.key,
        { ...section.data, enabled: on },
        section.version,
      );
      if (!result.ok) {
        setEnabled((current) => new Map(current).set(section.key, !on));
        toast.error(result.problem.detail ?? t("failed"));
        return;
      }
      toast.success(t(on ? "home.shownSaved" : "home.hiddenSaved", { name: section.name }));
      router.refresh();
    });
  };

  const row = (index: number, handle: ReactNode) => {
    const section = ordered[index];
    if (!section) return null;
    const on = enabled.get(section.key) ?? section.enabled;
    const chip = on ? RECORD_CHIPS.shown : RECORD_CHIPS.hidden;
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-mist-200 bg-white p-3 sm:flex-nowrap">
        {handle}
        <SectionThumb section={section.key} src={section.thumb} />
        <div className="min-w-0 flex-1 basis-40">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-navy-900">{section.name}</span>
            <StatusChip
              size="sm"
              tone={chip.tone}
              icon={chip.icon}
              label={on ? t("home.shown") : t("home.hidden")}
            />
          </p>
          <p className="mt-0.5 line-clamp-2 text-[13.5px] text-mist-600">{section.lead}</p>
        </div>
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
          <span className="flex items-center gap-1 sm:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("home.moveUp", { name: section.name })}
              disabled={pending || index === 0}
              onClick={() => move(index, index - 1)}
            >
              <ArrowUp aria-hidden="true" className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("home.moveDown", { name: section.name })}
              disabled={pending || index === ordered.length - 1}
              onClick={() => move(index, index + 1)}
            >
              <ArrowDown aria-hidden="true" className="size-4" />
            </Button>
          </span>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[13.5px] font-medium text-ink-900">
            <Switch
              checked={on}
              disabled={pending}
              aria-label={t("home.showFor", { name: section.name })}
              onCheckedChange={(next) => toggle(section, next)}
            />
            <span aria-hidden="true">{t("home.show")}</span>
          </label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label={t("home.editSection", { name: section.name })}
            onClick={() => setOpen(section.key)}
          >
            <Pencil aria-hidden="true" className="size-4" />
            {t("home.edit")}
          </Button>
        </div>
      </div>
    );
  };

  const openSection = open && open !== "hero" ? (byKey.get(open) ?? null) : null;

  return (
    <>
      <SortableList
        keys={order}
        onMove={move}
        nameOf={(index) => ordered[index]?.name ?? ""}
        disabled={pending}
        className="flex flex-col gap-2"
        renderItem={row}
      />
      <SectionSheet section={openSection} onOpenChange={(next) => (next ? null : setOpen(null))} />
      <HeroSheet
        hero={hero}
        open={open === "hero"}
        onOpenChange={(next) => (next ? null : setOpen(null))}
      />
    </>
  );
}

export { HomeSectionManager };
