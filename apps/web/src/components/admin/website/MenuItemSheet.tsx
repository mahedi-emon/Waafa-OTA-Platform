"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { IconPicker } from "@/components/admin/schema/IconPicker";
import { LinkPicker } from "@/components/admin/schema/LinkPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import type { ManagedMenu, MenuItemValue } from "./menuTypes";

type MenuItemSheetProps = {
  menu: ManagedMenu | null;
  /** The item being edited, or a new one (no id yet). */
  item: MenuItemValue | null;
  pending: boolean;
  onSave: (item: MenuItemValue) => void;
  onClose: () => void;
};

/**
 * One menu item (D0 R7): its words, where it goes (the link picker, never a typed path), and, where the menu uses
 * them, an icon, one line under it and the card's link text; Show keeps it on the site.
 */
function MenuItemSheet({ menu, item, pending, onSave, onClose }: MenuItemSheetProps) {
  const t = useTranslations("Admin.menus");
  const uid = useId();
  const [shown, setShown] = useState<MenuItemValue | null>(item);
  const [label, setLabel] = useState(item?.label ?? "");
  const [href, setHref] = useState(item?.href ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [icon, setIcon] = useState(item?.icon ?? "");
  const [cta, setCta] = useState(item?.cta ?? "");
  const [visible, setVisible] = useState(item?.visible ?? true);
  const [problem, setProblem] = useState<string | null>(null);
  // Another item opens with its own words (state follows the prop without an effect).
  if (item !== shown) {
    setShown(item);
    setLabel(item?.label ?? "");
    setHref(item?.href ?? "");
    setDescription(item?.description ?? "");
    setIcon(item?.icon ?? "");
    setCta(item?.cta ?? "");
    setVisible(item?.visible ?? true);
    setProblem(null);
  }
  const panelOnly = item?.panel === "more";

  const save = () => {
    if (!item) return;
    if (!label.trim()) return setProblem(t("item.labelNeeded"));
    if (!href && !panelOnly) return setProblem(t("item.linkNeeded"));
    const next: MenuItemValue = { ...item, label: label.trim(), visible };
    if (href) next.href = href;
    else delete next.href;
    for (const [name, value] of [
      ["description", description],
      ["icon", icon],
      ["cta", cta],
    ] as const) {
      if (value.trim()) next[name] = value.trim();
      else delete next[name];
    }
    onSave(next);
  };

  return (
    <Sheet open={menu !== null && item !== null} onOpenChange={(open) => (open ? null : onClose())}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {menu && item ? (
          <>
            <SheetHeader className="border-b border-mist-100">
              <SheetTitle>{item.id ? t("item.editTitle") : t("item.addTitle")}</SheetTitle>
              <SheetDescription>{t("item.lead", { menu: menu.name })}</SheetDescription>
            </SheetHeader>
            <form
              className="flex flex-col gap-5 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                save();
              }}
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${uid}-label`}>{t("item.label")}</Label>
                <Input
                  id={`${uid}-label`}
                  value={label}
                  maxLength={40}
                  onChange={(event) => setLabel(event.target.value)}
                  className="h-11"
                />
              </div>
              {panelOnly ? (
                <p className="rounded-xl bg-mist-50 p-3 text-[13.5px] text-mist-700">
                  {t("item.morePanel")}
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`${uid}-link`}>{t("item.link")}</Label>
                  <LinkPicker id={`${uid}-link`} value={href} onChange={(next) => setHref(next)} />
                </div>
              )}
              {menu.fields.description ? (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`${uid}-description`}>{t("item.description")}</Label>
                  <Input
                    id={`${uid}-description`}
                    value={description}
                    maxLength={80}
                    onChange={(event) => setDescription(event.target.value)}
                    className="h-11"
                  />
                </div>
              ) : null}
              {menu.fields.icon ? (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`${uid}-icon`}>{t("item.icon")}</Label>
                  <IconPicker id={`${uid}-icon`} value={icon || undefined} onChange={setIcon} />
                </div>
              ) : null}
              {menu.fields.cta ? (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`${uid}-cta`}>{t("item.cta")}</Label>
                  <Input
                    id={`${uid}-cta`}
                    value={cta}
                    maxLength={24}
                    onChange={(event) => setCta(event.target.value)}
                    className="h-11"
                  />
                </div>
              ) : null}
              {menu.fixedCount ? null : (
                <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-mist-200 px-4 py-2">
                  <Label htmlFor={`${uid}-visible`} className="text-[15px] font-semibold">
                    {t("item.visible")}
                  </Label>
                  <Switch id={`${uid}-visible`} checked={visible} onCheckedChange={setVisible} />
                </div>
              )}
              {problem ? (
                <p role="alert" className="text-[13.5px] font-medium text-danger-700">
                  {problem}
                </p>
              ) : null}
            </form>
            <SheetFooter className="sticky bottom-0 flex-row justify-end gap-2 border-t border-mist-100 bg-white">
              <Button type="button" variant="ghost" onClick={onClose}>
                {t("item.cancel")}
              </Button>
              <Button type="button" loading={pending} onClick={save}>
                {item.id ? t("item.save") : t("item.add")}
              </Button>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export { MenuItemSheet };
