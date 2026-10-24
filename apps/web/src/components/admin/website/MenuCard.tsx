"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { MenuIcon } from "@/components/icons/MenuIcon";
import { LinkTargetText } from "@/components/admin/schema/LinkTargetText";
import { SortableList } from "@/components/admin/schema/SortableList";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "@/i18n/navigation";
import { freeId } from "@/lib/admin/blueprints/slug";
import { saveRecord } from "@/lib/admin/contentActions";
import { movedOrder } from "@/lib/admin/homeSections";
import { MenuItemSheet } from "./MenuItemSheet";
import type { ManagedMenu, MenuItemValue } from "./menuTypes";

/**
 * One menu of the site (D0 R7, ADMIN.md §5.8): its items in order (drag, or Move up / down), each with where it goes
 * in words, a Show switch, Edit and Remove with Undo; Add an item opens the same sheet. Every change saves at once.
 */
function MenuCard({ menu }: { menu: ManagedMenu }) {
  const t = useTranslations("Admin.menus");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState(menu.items);
  // The version the next save builds on: each save's answer moves it on, so Undo right after a save still fits.
  const version = useRef(menu.version);
  const [seen, setSeen] = useState(menu);
  const [editing, setEditing] = useState<MenuItemValue | null>(null);
  // A refresh from the server brings the saved menu.
  if (seen !== menu) {
    setSeen(menu);
    setItems(menu.items);
  }

  const persist = (next: MenuItemValue[], done: string, undo?: MenuItemValue[]) => {
    const previous = items;
    setItems(next);
    startTransition(async () => {
      const result = await saveRecord(
        "menus",
        menu.key,
        { ...menu.data, items: next },
        Math.max(version.current, menu.version),
      );
      if (!result.ok) {
        setItems(previous);
        toast.error(result.problem.fields?.[0]?.message ?? result.problem.detail ?? t("failed"));
        return;
      }
      version.current = result.version;
      setEditing(null);
      toast.success(
        done,
        undo
          ? { action: { label: t("undo"), onClick: () => persist(undo, t("restored")) } }
          : undefined,
      );
      router.refresh();
    });
  };

  const saveItem = (item: MenuItemValue) => {
    if (item.id) {
      persist(
        items.map((current) => (current.id === item.id ? item : current)),
        t("saved"),
      );
      return;
    }
    const id = freeId(item.label, new Set(items.map((current) => current.id)));
    persist([...items, { ...item, id }], t("added", { label: item.label }));
  };

  const row = (index: number, handle: ReactNode) => {
    const item = items[index];
    if (!item) return null;
    return (
      <div className="flex items-center gap-2 rounded-xl border border-mist-200 bg-white p-2 sm:gap-3">
        {handle}
        {menu.fields.icon ? (
          <span className="hidden size-9 shrink-0 items-center justify-center rounded-lg bg-electric-50 text-brand-700 sm:flex">
            <MenuIcon name={item.icon} className="size-4.5" />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-navy-900">{item.label}</p>
          <p className="truncate text-[13px] text-mist-600">
            <LinkTargetText
              href={item.href}
              empty={item.panel === "more" ? t("opensMore") : t("noLink")}
            />
          </p>
        </div>
        {menu.fixedCount ? null : (
          <Switch
            checked={item.visible}
            disabled={pending}
            aria-label={t("showItem", { label: item.label })}
            onCheckedChange={(on) =>
              persist(
                items.map((current) =>
                  current.id === item.id ? { ...current, visible: on } : current,
                ),
                on ? t("shown", { label: item.label }) : t("hidden", { label: item.label }),
              )
            }
          />
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("editItem", { label: item.label })}
          onClick={() => setEditing(item)}
        >
          <Pencil aria-hidden="true" className="size-4" />
        </Button>
        {menu.fixedCount ? null : (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            aria-label={t("removeItem", { label: item.label })}
            onClick={() =>
              persist(
                items.filter((current) => current.id !== item.id),
                t("removed", { label: item.label }),
                items,
              )
            }
            className="text-danger-700"
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <section
      aria-labelledby={`menu-${menu.key}`}
      className="flex flex-col gap-3 rounded-2xl border border-mist-200 bg-mist-50 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 id={`menu-${menu.key}`} className="font-display text-[16px] font-bold text-navy-900">
            {menu.name}
          </h3>
          <p className="text-[13.5px] text-mist-600">{menu.lead}</p>
        </div>
        {menu.fixedCount ? null : (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setEditing({ id: "", label: "", visible: true })}
          >
            <Plus aria-hidden="true" className="size-4" />
            {t("add")}
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-mist-300 px-3 py-6 text-center text-[14px] text-mist-600">
          {t("empty")}
        </p>
      ) : (
        <SortableList
          keys={items.map((item) => item.id)}
          onMove={(from, to) => {
            const ids = movedOrder(
              items.map((item) => item.id),
              from,
              to,
            );
            const byId = new Map(items.map((item) => [item.id, item]));
            persist(
              ids.flatMap((id) => {
                const item = byId.get(id);
                return item ? [item] : [];
              }),
              t("orderSaved"),
            );
          }}
          nameOf={(index) => items[index]?.label ?? ""}
          disabled={pending}
          className="flex flex-col gap-2"
          renderItem={row}
        />
      )}
      <MenuItemSheet
        menu={editing ? menu : null}
        item={editing}
        pending={pending}
        onSave={saveItem}
        onClose={() => setEditing(null)}
      />
    </section>
  );
}

export { MenuCard };
