"use client";

import { useId, useState, useTransition } from "react";
import { ArrowRight, Film, ImageIcon } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Link, useRouter } from "@/i18n/navigation";
import { saveSetting } from "@/lib/admin/contentActions";
import { SectionThumb } from "./SectionThumb";
import { SitePreview } from "./SitePreview";
import type { HeroData } from "./types";

type HeroSheetProps = {
  hero: HeroData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** "Bali, Dubai" or one per line → the places that turn in the headline (at most eight). */
const placesOf = (text: string) =>
  text
    .split(/\n|,/)
    .map((place) => place.trim())
    .filter(Boolean)
    .slice(0, 8);

/**
 * The hero editor (ADMIN.md §5.8): the headline, its blue second line, the line under it and the places that turn
 * in it, the photo or video (with its phone version) in Site images, and the top of the home page as a preview.
 */
function HeroSheet({ hero, open, onOpenChange }: HeroSheetProps) {
  const t = useTranslations("Admin.website");
  const router = useRouter();
  const uid = useId();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(hero.title);
  const [accent, setAccent] = useState(hero.titleAccent);
  const [lead, setLead] = useState(hero.lead);
  const [label, setLabel] = useState(hero.rotatingLabel);
  const [places, setPlaces] = useState(hero.rotating.join("\n"));
  const [problem, setProblem] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const save = () => {
    const rotating = placesOf(places);
    if (!title.trim() || !accent.trim() || !lead.trim() || !label.trim())
      return setProblem(t("hero.needed"));
    if (rotating.length === 0) return setProblem(t("hero.placesNeeded"));
    setProblem(null);
    const next = {
      ...hero.content,
      hero: {
        title: title.trim(),
        titleAccent: accent.trim(),
        lead: lead.trim(),
        rotatingLabel: label.trim(),
        rotating,
      },
    };
    startTransition(async () => {
      const result = await saveSetting("homeContent", next, hero.version);
      if (!result.ok) {
        const message = result.problem.fields?.[0]?.message ?? result.problem.detail ?? t("failed");
        setProblem(message);
        toast.error(message);
        return;
      }
      toast.success(t("saved"));
      setReloadKey((key) => key + 1);
      router.refresh();
    });
  };

  const MediaIcon = hero.media.kind === "video" ? Film : ImageIcon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b border-mist-100">
          <SheetTitle>{t("hero.title")}</SheetTitle>
          <SheetDescription>{t("hero.lead")}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-5 p-4">
          <section className="flex items-center gap-4 rounded-xl border border-mist-200 p-3">
            <SectionThumb section="hero" src={hero.media.src} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[14.5px] font-semibold text-navy-900">
                <MediaIcon aria-hidden="true" className="size-4 text-mist-600" />
                {hero.media.kind === "video"
                  ? t("hero.video")
                  : hero.media.kind === "photo"
                    ? t("hero.photo")
                    : t("hero.noMedia")}
              </p>
              {hero.media.kind === "video" ? (
                <p className="text-[13px] text-mist-600">
                  {hero.media.phoneVersion ? t("hero.phoneVersion") : t("hero.noPhoneVersion")}
                </p>
              ) : null}
              <Link
                href={hero.mediaHref}
                prefetch={false}
                className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-[14px] font-semibold text-brand-700 hover:underline"
              >
                {t("hero.changeMedia")}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </section>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${uid}-title`}>{t("hero.fields.title")}</Label>
            <Input
              id={`${uid}-title`}
              value={title}
              maxLength={60}
              onChange={(event) => setTitle(event.target.value)}
              className="h-11"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${uid}-accent`}>{t("hero.fields.titleAccent")}</Label>
            <Input
              id={`${uid}-accent`}
              value={accent}
              maxLength={60}
              aria-describedby={`${uid}-accent-help`}
              onChange={(event) => setAccent(event.target.value)}
              className="h-11"
            />
            <p id={`${uid}-accent-help`} className="text-[13px] text-mist-600">
              {t("hero.fields.titleAccentHelp")}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${uid}-lead`}>{t("hero.fields.lead")}</Label>
            <Textarea
              id={`${uid}-lead`}
              value={lead}
              maxLength={220}
              rows={3}
              onChange={(event) => setLead(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${uid}-label`}>{t("hero.fields.rotatingLabel")}</Label>
            <Input
              id={`${uid}-label`}
              value={label}
              maxLength={30}
              onChange={(event) => setLabel(event.target.value)}
              className="h-11"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${uid}-places`}>{t("hero.fields.rotating")}</Label>
            <Textarea
              id={`${uid}-places`}
              value={places}
              rows={5}
              aria-describedby={`${uid}-places-help`}
              onChange={(event) => setPlaces(event.target.value)}
            />
            <p id={`${uid}-places-help`} className="text-[13px] text-mist-600">
              {t("hero.fields.rotatingHelp")}
            </p>
          </div>
          {problem ? (
            <p role="alert" className="text-[13.5px] font-medium text-danger-700">
              {problem}
            </p>
          ) : null}
          <section className="flex flex-col gap-2">
            <h3 className="text-[13px] font-semibold text-navy-900">{t("sheet.preview")}</h3>
            <p className="text-[13px] text-mist-600">{t("sheet.previewNote")}</p>
            <SitePreview
              path="/"
              focus="hero"
              reloadKey={reloadKey}
              title={t("sheet.previewTitle", { name: t("hero.title") })}
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
      </SheetContent>
    </Sheet>
  );
}

export { HeroSheet };
