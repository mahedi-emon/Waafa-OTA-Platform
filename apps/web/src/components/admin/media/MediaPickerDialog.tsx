"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  Check,
  ImageOff,
  LoaderCircle,
  RotateCcw,
  Search,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { MediaAsset } from "@waafa/shared";
import { formatBytes, PHOTO_TYPES, VIDEO_TYPES, type MediaKind } from "@waafa/shared/helpers/media";
import { cn } from "cn";
import { AdminEmpty } from "@/components/admin/AdminEmpty";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { suggestAlt } from "@/lib/admin/photoFrame";
import { MediaThumb } from "./MediaThumb";
import { altFromName } from "./uploadMedia";
import { useMediaLibrary } from "./useMediaLibrary";
import { useProblemText } from "./useProblemText";
import { useUploadQueue } from "./useUploadQueue";

export type MediaPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: MediaKind;
  /** Gallery: choose several, in the order they are ticked. */
  multiple?: boolean;
  /** Narrower photos are marked: they would look soft where this field shows them. */
  minWidth?: number | undefined;
  /** Addresses already in the field, marked "In this field". */
  current?: string[];
  /** New uploads are described with this until staff improve it (the record's title). */
  title?: string | undefined;
  onChoose: (assets: MediaAsset[]) => void;
};

const THUMB_SIZES = "(min-width: 1024px) 170px, (min-width: 640px) 30vw, 45vw";

/**
 * Choose files from the media library (ADMIN.md §11): search by alt text or file name, only the ones not used yet,
 * page through, and upload new ones without leaving (they are ticked when they arrive). Loads with its first opening.
 */
function MediaPickerDialog({
  open,
  onOpenChange,
  kind,
  multiple = false,
  minWidth,
  current = [],
  title,
  onChoose,
}: MediaPickerDialogProps) {
  const t = useTranslations("Admin.media.picker");
  const problemText = useProblemText();
  const searchId = useId();
  const unusedId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [typed, setTyped] = useState("");
  const [q, setQ] = useState("");
  const [unused, setUnused] = useState(false);
  const [page, setPage] = useState(1);
  const [picked, setPicked] = useState<MediaAsset[]>([]);
  // Each opening starts with nothing ticked (the search and filter stay as they were).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setPicked([]);
  }
  const library = useMediaLibrary({ q, kind, unused, page }, open);
  const uploads = useUploadQueue({
    altFor: (file) => suggestAlt(title, altFromName(file.name)),
    onUploaded: (asset) => {
      setPicked((now) => (multiple ? [...now, asset] : [asset]));
      library.reload();
    },
  });

  // Search after typing stops for a moment, from the first page.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(typed.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [typed]);

  const toggle = (asset: MediaAsset) =>
    setPicked((now) => {
      if (now.some((item) => item.id === asset.id))
        return now.filter((item) => item.id !== asset.id);
      return multiple ? [...now, asset] : [asset];
    });
  const choose = (assets: MediaAsset[]) => {
    if (assets.length === 0) return;
    onChoose(assets);
    uploads.clearDone();
    onOpenChange(false);
  };
  const pages = Math.max(1, Math.ceil(library.total / library.pageSize));
  const inField = new Set(current);
  const accept = (kind === "photo" ? PHOTO_TYPES : VIDEO_TYPES).join(",");
  const waiting = uploads.items.filter((item) => item.status !== "done");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(92dvh,780px)] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="gap-1 border-b border-mist-200 px-5 pt-5 pb-4 text-left">
          <DialogTitle>{t(`title.${kind}${multiple ? "Many" : "One"}`)}</DialogTitle>
          <DialogDescription>{t("lead")}</DialogDescription>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <label htmlFor={searchId} className="sr-only">
                {t("search")}
              </label>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-mist-500"
              />
              <Input
                id={searchId}
                type="search"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                placeholder={t("search")}
                className="pl-9"
              />
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-start">
              <label
                htmlFor={unusedId}
                className="flex min-h-11 cursor-pointer items-center gap-2 text-[14px] font-medium text-navy-900"
              >
                <Switch
                  id={unusedId}
                  checked={unused}
                  onCheckedChange={(next) => {
                    setUnused(next);
                    setPage(1);
                  }}
                />
                {t("unused")}
              </label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInput.current?.click()}
              >
                <Upload aria-hidden="true" className="size-4" />
                {t(`upload.${kind}`)}
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept={accept}
                multiple={multiple}
                tabIndex={-1}
                aria-hidden="true"
                className="sr-only"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  event.target.value = "";
                  if (files.length) uploads.add(multiple ? files : files.slice(0, 1));
                }}
              />
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {waiting.length > 0 ? (
            <ul aria-label={t("uploading")} className="mb-4 flex flex-col gap-2">
              {waiting.map((item) => (
                <li
                  key={item.key}
                  className="flex min-w-0 items-center gap-3 rounded-xl border border-mist-200 bg-mist-50 px-3 py-2"
                >
                  {item.status === "failed" ? (
                    <TriangleAlert aria-hidden="true" className="size-4 shrink-0 text-danger-600" />
                  ) : (
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-4 shrink-0 animate-spin text-brand-700 motion-reduce:animate-none"
                    />
                  )}
                  <span className="min-w-0 flex-1 truncate text-[14px] text-navy-900">
                    {item.file.name}
                  </span>
                  {item.status === "failed" ? (
                    <>
                      <span className="text-[13px] text-danger-700">
                        {problemText(item.problem, kind)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => uploads.retry(item.key)}
                      >
                        <RotateCcw aria-hidden="true" className="size-4" />
                        {t("retry")}
                      </Button>
                    </>
                  ) : (
                    <span className="text-[13px] text-mist-600 tabular-nums">
                      {Math.round(item.progress * 100)}%
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => uploads.dismiss(item.key)}
                  >
                    {item.status === "failed" ? t("dismiss") : t("cancel")}
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}

          {library.status === "failed" ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-[15px] text-navy-900">{t("failed")}</p>
              <Button type="button" variant="secondary" size="sm" onClick={library.reload}>
                <RotateCcw aria-hidden="true" className="size-4" />
                {t("retry")}
              </Button>
            </div>
          ) : library.status === "loading" && library.items.length === 0 ? (
            <ul
              aria-hidden="true"
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            >
              {Array.from({ length: 10 }, (_, index) => (
                <li key={index} className="flex flex-col gap-2">
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <Skeleton className="h-3.5 w-3/4" />
                </li>
              ))}
            </ul>
          ) : library.items.length === 0 ? (
            <AdminEmpty
              icons={[ImageOff]}
              title={q || unused ? t("noMatch") : t(`empty.${kind}`)}
              body={q || unused ? t("noMatchBody") : t("emptyBody")}
            />
          ) : (
            <ul
              aria-label={t(`list.${kind}`)}
              aria-busy={library.status === "loading"}
              className={cn(
                "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
                library.status === "loading" && "opacity-60",
              )}
            >
              {library.items.map((asset) => {
                const chosen = picked.findIndex((item) => item.id === asset.id);
                const small =
                  minWidth !== undefined && asset.kind === "photo" && asset.width < minWidth;
                const label = asset.alt || asset.originalName || t("noAlt");
                return (
                  <li key={asset.id} className="min-w-0">
                    <button
                      type="button"
                      aria-pressed={chosen >= 0}
                      onClick={() => toggle(asset)}
                      onDoubleClick={() => (multiple ? undefined : choose([asset]))}
                      className={cn(
                        "group relative flex w-full flex-col overflow-hidden rounded-xl border bg-white text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        chosen >= 0
                          ? "border-electric-600 ring-2 ring-electric-600"
                          : "border-mist-200 hover:border-mist-400",
                      )}
                    >
                      <span className="relative block aspect-square w-full overflow-hidden">
                        <MediaThumb url={asset.url} kind={asset.kind} alt="" sizes={THUMB_SIZES} />
                        {chosen >= 0 ? (
                          <span
                            aria-hidden="true"
                            className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-electric-600 text-[13px] font-semibold text-white tabular-nums shadow-md"
                          >
                            {multiple ? chosen + 1 : <Check className="size-4" />}
                          </span>
                        ) : null}
                        {inField.has(asset.url) ? (
                          <span className="absolute bottom-2 left-2 rounded-full bg-midnight-950/75 px-2 py-0.5 text-[12px] font-medium text-white">
                            {t("inField")}
                          </span>
                        ) : null}
                      </span>
                      <span className="flex min-w-0 flex-col gap-0.5 px-2.5 py-2">
                        <span className="truncate text-[13.5px] font-medium text-navy-900">
                          {label}
                        </span>
                        <span className="flex items-center gap-1.5 text-[12.5px] text-mist-600 tabular-nums">
                          {asset.kind === "photo"
                            ? `${asset.width} × ${asset.height}`
                            : formatBytes(asset.bytes)}
                          {small ? (
                            <span className="inline-flex items-center gap-1 font-medium text-warning-800">
                              <TriangleAlert aria-hidden="true" className="size-3.5" />
                              {t("small")}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter className="flex-col gap-3 border-t border-mist-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {pages > 1 ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((now) => Math.max(1, now - 1))}
                >
                  {t("previous")}
                </Button>
                <span className="text-[13.5px] text-mist-600 tabular-nums">
                  {t("page", { page, pages })}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={page >= pages}
                  onClick={() => setPage((now) => Math.min(pages, now + 1))}
                >
                  {t("next")}
                </Button>
              </>
            ) : null}
          </div>
          <div className="flex items-center justify-end gap-2">
            <span aria-live="polite" className="text-[13.5px] text-mist-600 tabular-nums">
              {multiple && picked.length > 0 ? t("picked", { count: picked.length }) : ""}
            </span>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button
              type="button"
              disabled={picked.length === 0 || uploads.busy}
              onClick={() => choose(picked)}
            >
              {multiple && picked.length > 1
                ? t("chooseMany", { count: picked.length })
                : t("choose")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { MediaPickerDialog };
