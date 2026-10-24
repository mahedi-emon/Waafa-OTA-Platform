"use client";

import { useId, useState, useTransition } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { Link, useRouter } from "@/i18n/navigation";
import { saveRecord } from "@/lib/admin/contentActions";
import { SitePreview } from "./SitePreview";
import type { ManagedSection } from "./types";

type SectionSheetProps = {
  section: ManagedSection | null;
  onOpenChange: (open: boolean) => void;
};

/**
 * One home section in a side sheet (ADMIN.md §5.8): whether it shows, its heading words (empty uses the standard
 * words), where its content is edited, and the home page at phone width scrolled to it, reloaded after each save.
 */
function SectionSheet({ section, onOpenChange }: SectionSheetProps) {
  const t = useTranslations("Admin.website");
  const router = useRouter();
  const uid = useId();
  const [pending, startTransition] = useTransition();
  const [shown, setShown] = useState<ManagedSection | null>(section);
  const [enabled, setEnabled] = useState(section?.enabled ?? true);
  const [kicker, setKicker] = useState(section?.kicker ?? "");
  const [title, setTitle] = useState(section?.title ?? "");
  const [subtitle, setSubtitle] = useState(section?.subtitle ?? "");
  const [reloadKey, setReloadKey] = useState(0);
  // Another section opens with its own words (state follows the prop without an effect).
  if (section && section.key !== shown?.key) {
    setShown(section);
    setEnabled(section.enabled);
    setKicker(section.kicker);
    setTitle(section.title);
    setSubtitle(section.subtitle);
  }

  const save = () => {
    if (!section) return;
    const words = (value: string) => (value.trim() ? value.trim() : undefined);
    const data: Record<string, unknown> = { ...section.data, enabled };
    for (const [name, value] of [
      ["kicker", kicker],
      ["title", title],
      ["subtitle", subtitle],
    ] as const) {
      const next = words(value);
      if (next === undefined) delete data[name];
      else data[name] = next;
    }
    startTransition(async () => {
      const result = await saveRecord("homeSections", section.key, data, section.version);
      if (!result.ok) {
        toast.error(result.problem.fields?.[0]?.message ?? result.problem.detail ?? t("failed"));
        return;
      }
      toast.success(t("saved"));
      setReloadKey((key) => key + 1);
      router.refresh();
    });
  };

  return (
    <Sheet open={section !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        {section ? (
          <>
            <SheetHeader className="border-b border-mist-100">
              <SheetTitle>{section.name}</SheetTitle>
              <SheetDescription>{section.lead}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-5 p-4">
              <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-mist-200 px-4 py-2">
                <Label htmlFor={`${uid}-show`} className="text-[15px] font-semibold">
                  {t("sheet.show")}
                </Label>
                <Switch id={`${uid}-show`} checked={enabled} onCheckedChange={setEnabled} />
              </div>
              {section.headings ? (
                <div className="flex flex-col gap-4">
                  <p className="text-[13.5px] text-mist-600">{t("sheet.defaultsHelp")}</p>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`${uid}-kicker`}>{t("sheet.kicker")}</Label>
                    <Input
                      id={`${uid}-kicker`}
                      value={kicker}
                      placeholder={section.defaults.kicker}
                      maxLength={40}
                      onChange={(event) => setKicker(event.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`${uid}-title`}>{t("sheet.heading")}</Label>
                    <Input
                      id={`${uid}-title`}
                      value={title}
                      placeholder={section.defaults.title}
                      maxLength={80}
                      onChange={(event) => setTitle(event.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`${uid}-subtitle`}>{t("sheet.line")}</Label>
                    <Textarea
                      id={`${uid}-subtitle`}
                      value={subtitle}
                      placeholder={section.defaults.subtitle}
                      maxLength={220}
                      rows={3}
                      onChange={(event) => setSubtitle(event.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-[13.5px] text-mist-600">{t("sheet.noHeadings")}</p>
              )}
              {section.links.length > 0 ? (
                <section className="flex flex-col gap-1.5">
                  <h3 className="text-[13px] font-semibold text-navy-900">
                    {t("sheet.contentTitle")}
                  </h3>
                  <ul className="flex flex-col">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          prefetch={false}
                          className="flex min-h-11 items-center justify-between gap-2 rounded-lg px-2 text-[14.5px] font-semibold text-brand-700 hover:bg-electric-50 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                        >
                          {link.label}
                          <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              <section className="flex flex-col gap-2">
                <h3 className="text-[13px] font-semibold text-navy-900">{t("sheet.preview")}</h3>
                <p className="text-[13px] text-mist-600">{t("sheet.previewNote")}</p>
                <SitePreview
                  path="/"
                  focus={section.key === "hero" ? "hero" : `homeSections:${section.key}`}
                  reloadKey={reloadKey}
                  title={t("sheet.previewTitle", { name: section.name })}
                />
              </section>
            </div>
            <SheetFooter className="sticky bottom-0 flex-row justify-end gap-2 border-t border-mist-100 bg-white">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {t("sheet.close")}
              </Button>
              <Button type="button" loading={pending} onClick={save}>
                {t("sheet.save")}
              </Button>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export { SectionSheet };
