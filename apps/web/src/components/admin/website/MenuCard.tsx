"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Ellipsis, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { MenuIcon } from "@/components/icons/MenuIcon";
import { LinkTargetText } from "@/components/admin/schema/LinkTargetText";
import { SortableList } from "@/components/admin/schema/SortableList";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "@/i18n/navigation";
import { freeId } from "@/lib/admin/blueprints/slug";
import { saveRecord } from "@/lib/admin/contentActions";
import { movedOrder } from "@/lib/admin/homeSections";
import { MenuItemSheet } from "./MenuItemSheet";
import type { ManagedMenu, MenuItemValue } from "./menuTypes";

/** The tab bar's middle tab: always Waafas World, always there (correction 3). */
const CENTRE_TAB = 2;

/**
 * One menu of the site (D0 R7, ADMIN.md §5.8): its items in order (drag, or Move up / down in each item's menu), each
 * with where it goes in words, a Show switch, Edit, and Remove with Undo; Add an item opens the same sheet. Every
 * change saves at once, one after another, so quick changes never overtake each other. The tab bar keeps its five
 * tabs in their places: their words, links and icons change, the middle one not at all.
 */
function MenuCard({ menu }: { menu: ManagedMenu }) {
  const t = useTranslations("Admin.menus");
  const router = useRouter();
  const [items, setItems] = useState(menu.items);
  const [seen, setSeen] = useState(menu);
  const [busy, setBusy] = useState(0);
  const [editing, setEditing] = useState<MenuItemValue | null>(null);
  const [sheetSaving, setSheetSaving] = useState(false);
  // The latest list and version the next save builds on (each save's answer moves the version on).
  const latest = useRef(menu.items);
  const version = useRef(menu.version);
  const chain = useRef<Promise<void>>(Promise.resolve());
  const queued = useRef(0);
  const focusNext = useRef<string | null>(null);
  // A refresh from the server brings the saved menu, once the queued saves are done.
  if (seen !== menu && busy === 0) {
    setSeen(menu);
    setItems(menu.items);
  }
  const fixed = menu.fixedCount;
  const ids = `menu-${menu.key}`;

  useEffect(() => {
    latest.current = items;
    // After a Remove, focus moves to the next item's Edit (or the Add button) instead of falling to the page.
    const target = focusNext.current;
    if (!target) return;
    focusNext.current = null;
    document.getElementById(target)?.focus();
  }, [items]);

  /** Saves one change after the ones before it; the page refreshes from the server once the last is done. */
  const persist = (
    next: MenuItemValue[],
    done: string,
    options: { undo?: () => MenuItemValue[] | null; fromSheet?: boolean } = {},
  ) => {
    const previous = latest.current;
    latest.current = next;
    setItems(next);
    queued.current += 1;
    setBusy(queued.current);
    if (options.fromSheet) setSheetSaving(true);
    const work = async () => {
      const result = await saveRecord(
        "menus",
        menu.key,
        { ...menu.data, items: next },
        Math.max(version.current, menu.version),
      );
      if (options.fromSheet) setSheetSaving(false);
      if (!result.ok) {
        latest.current = previous;
        setItems(previous);
        toast.error(result.problem.fields?.[0]?.message ?? result.problem.detail ?? t("failed"));
        return;
      }
      version.current = result.version;
      if (options.fromSheet) setEditing(null);
      const undo = options.undo;
      // One toast per menu: a newer change replaces it, so an old Undo can't come back later.
      toast.success(done, {
        id: ids,
        ...(undo
          ? {
              action: {
                label: t("undo"),
                onClick: () => {
                  const restored = undo();
                  if (restored) persist(restored, t("restored"));
                },
              },
            }
          : {}),
      });
    };
    chain.current = chain.current.then(work, work).finally(() => {
      queued.current -= 1;
      setBusy(queued.current);
      if (queued.current === 0) router.refresh();
    });
  };

  const saveItem = (item: MenuItemValue) => {
    if (sheetSaving) return;
    const current = latest.current;
    if (item.id) {
      persist(
        current.map((other) => (other.id === item.id ? item : other)),
        t("saved"),
        { fromSheet: true },
      );
      return;
    }
    const id = freeId(item.label, new Set(current.map((other) => other.id)));
    persist([...current, { ...item, id }], t("added", { label: item.label }), { fromSheet: true });
  };

  const move = (from: number, to: number) => {
    const current = latest.current;
    const order = movedOrder(
      current.map((item) => item.id),
      from,
      to,
    );
    const byId = new Map(current.map((item) => [item.id, item]));
    persist(
      order.flatMap((id) => {
        const item = byId.get(id);
        return item ? [item] : [];
      }),
      t("orderSaved"),
    );
  };

  const remove = (item: MenuItemValue) => {
    const current = latest.current;
    const index = current.findIndex((other) => other.id === item.id);
    if (index === -1) return;
    const after = current[index + 1] ?? current[index - 1];
    focusNext.current = after ? `${ids}-edit-${after.id}` : `${ids}-add`;
    persist(
      current.filter((other) => other.id !== item.id),
      t("removed", { label: item.label }),
      {
        // Undo puts this one item back where it was in the list as it is now; later changes stay.
        undo: () => {
          const now = latest.current;
          if (now.some((other) => other.id === item.id)) return null;
          const back = [...now];
          back.splice(Math.min(index, back.length), 0, item);
          return back;
        },
      },
    );
  };

  const row = (index: number, handle: ReactNode) => {
    const item = items[index];
    if (!item) return null;
    const locked = fixed && index === CENTRE_TAB;
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-mist-200 bg-white p-2 sm:gap-x-3">
        {handle}
        {menu.fields.icon ? (
          <span className="hidden size-9 shrink-0 items-center justify-center rounded-lg bg-electric-50 text-brand-700 sm:flex">
            <MenuIcon name={item.icon} className="size-4.5" />
          </span>
        ) : null}
        {/* On the narrowest phones the controls drop to a second line, so the words keep their room. */}
        <div className="min-w-0 flex-1 basis-28">
          <p className="truncate font-semibold text-navy-900">{item.label}</p>
          <p className="truncate text-[13px] text-mist-600">
            {locked ? (
              t("centreTab")
            ) : (
              <LinkTargetText
                href={item.href}
                empty={item.panel === "more" ? t("opensMore") : t("noLink")}
              />
            )}
          </p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {fixed ? null : (
            <Switch
              checked={item.visible}
              aria-label={t("showItem", { label: item.label })}
              onCheckedChange={(on) =>
                persist(
                  latest.current.map((other) =>
                    other.id === item.id ? { ...other, visible: on } : other,
                  ),
                  on ? t("shown", { label: item.label }) : t("hidden", { label: item.label }),
                )
              }
            />
          )}
          {locked ? (
            <span
              className="flex size-[38px] shrink-0 items-center justify-center text-mist-500"
              title={t("centreTab")}
            >
              <Lock aria-hidden="true" className="size-4" />
            </span>
          ) : (
            <Button
              id={`${ids}-edit-${item.id}`}
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("editItem", { label: item.label })}
              onClick={() => setEditing(item)}
            >
              <Pencil aria-hidden="true" className="size-4" />
            </Button>
          )}
          {fixed ? null : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("moreFor", { label: item.label })}
                >
                  <Ellipsis aria-hidden="true" className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-44">
                <DropdownMenuItem
                  disabled={index === 0}
                  onSelect={() => move(index, index - 1)}
                  className="min-h-11 text-[15px]"
                >
                  <ArrowUp aria-hidden="true" className="size-4" />
                  {t("moveUp")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={index === items.length - 1}
                  onSelect={() => move(index, index + 1)}
                  className="min-h-11 text-[15px]"
                >
                  <ArrowDown aria-hidden="true" className="size-4" />
                  {t("moveDown")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => remove(item)}
                  className="min-h-11 text-[15px]"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                  {t("remove")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  };

  return (
    <section
      aria-labelledby={`${ids}-name`}
      className="flex flex-col gap-3 rounded-2xl border border-mist-200 bg-mist-50 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 id={`${ids}-name`} className="font-display text-[16px] font-bold text-navy-900">
            {menu.name}
          </h3>
          <p className="text-[13.5px] text-mist-600">{menu.lead}</p>
        </div>
        {fixed ? null : (
          <Button
            id={`${ids}-add`}
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
          onMove={move}
          nameOf={(index) => items[index]?.label ?? ""}
          disabled={fixed}
          className="flex flex-col gap-2"
          renderItem={row}
        />
      )}
      <MenuItemSheet
        menu={editing ? menu : null}
        item={editing}
        pending={sheetSaving}
        onSave={saveItem}
        onClose={() => setEditing(null)}
      />
    </section>
  );
}

export { MenuCard };
