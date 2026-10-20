"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useState, useTransition } from "react";
import { Copy, Crop, ExternalLink, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { MediaAsset, MediaUse } from "@waafa/shared";
import { formatBytes } from "@waafa/shared/helpers/media";
import { MediaThumb } from "@/components/admin/media/MediaThumb";
import { markSignedOut } from "@/components/admin/sessionStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Link, useRouter } from "@/i18n/navigation";
import { removeMedia, replaceMedia, updateMedia } from "@/lib/admin/mediaActions";

const MediaPickerDialog = dynamic(
  () =>
    import("@/components/admin/media/MediaPickerDialog").then((module) => module.MediaPickerDialog),
  { ssr: false },
);
const ImageCropDialog = dynamic(
  () => import("@/components/admin/media/ImageCropDialog").then((module) => module.ImageCropDialog),
  { ssr: false },
);

export type LibraryItem = MediaAsset & { createdLabel: string };

type MediaDetailsSheetProps = {
  /** The file shown (kept while the sheet slides away). */
  item: LibraryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canDelete: boolean;
  /** Content key → its name in the admin ("Tour packages"), for the places a file shows. */
  keyNames: Record<string, string>;
};

type Usage = { status: "loading" | "ready" | "failed"; items: MediaUse[] };

/**
 * One library file (ADMIN.md §5.7): preview, its description and credit, sizes, every place it shows with a link,
 * Replace everywhere and Delete (only when nothing shows it). Videos never play by themselves here.
 */
function MediaDetailsSheet({
  item,
  open,
  onOpenChange,
  canDelete,
  keyNames,
}: MediaDetailsSheetProps) {
  const t = useTranslations("Admin.mediaLibrary.details");
  const router = useRouter();
  const altId = useId();
  const creditId = useId();
  const creditUrlId = useId();
  const [alt, setAlt] = useState("");
  const [credit, setCredit] = useState("");
  const [creditUrl, setCreditUrl] = useState("");
  const [usage, setUsage] = useState<Usage>({ status: "loading", items: [] });
  const [usageVersion, setUsageVersion] = useState(0);
  const [saving, startSaving] = useTransition();
  const [working, startWorking] = useTransition();
  const [dialog, setDialog] = useState<
    "picker" | "crop" | "confirmReplace" | "confirmDelete" | null
  >(null);
  const [used, setUsed] = useState<{ picker: boolean; crop: boolean }>({
    picker: false,
    crop: false,
  });
  const [replacement, setReplacement] = useState<MediaAsset | null>(null);

  // Each file opens with its own words.
  const [shownId, setShownId] = useState<string | null>(null);
  if (item && item.id !== shownId) {
    setShownId(item.id);
    setAlt(item.alt);
    setCredit(item.credit ?? "");
    setCreditUrl(item.creditUrl ?? "");
    setUsage({ status: "loading", items: [] });
  }

  useEffect(() => {
    if (!item || !open) return;
    const controller = new AbortController();
    fetch(`/secure-admin-control/api/media/${item.id}/usage`, {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401) markSignedOut();
        if (!response.ok) throw new Error(String(response.status));
        const body = (await response.json()) as { items: MediaUse[] };
        setUsage({ status: "ready", items: body.items });
      })
      .catch((error: unknown) => {
        if ((error as { name?: string }).name === "AbortError") return;
        setUsage({ status: "failed", items: [] });
      });
    return () => controller.abort();
  }, [item, open, usageVersion]);

  if (!item) return null;

  const name = item.alt || item.originalName || t("untitled");
  const altOk = alt.trim().length >= 3;
  const changed =
    alt.trim() !== item.alt ||
    credit.trim() !== (item.credit ?? "") ||
    creditUrl.trim() !== (item.creditUrl ?? "");
  const uses = usage.status === "ready" ? usage.items.length : item.uses;

  const save = () =>
    startSaving(async () => {
      const result = await updateMedia(item.id, {
        alt: alt.trim(),
        ...(credit.trim() ? { credit: credit.trim() } : {}),
        ...(creditUrl.trim() ? { creditUrl: creditUrl.trim() } : {}),
      });
      if (!result.ok) {
        if (result.problem.status === 401) markSignedOut();
        toast.error(result.problem.status === 422 ? t("invalid") : t("failed"));
        return;
      }
      toast.success(t("saved"));
      router.refresh();
    });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(new URL(item.url, window.location.origin).toString());
      toast.success(t("copied"));
    } catch {
      toast.error(t("failed"));
    }
  };

  const replace = () => {
    if (!replacement) return;
    startWorking(async () => {
      const result = await replaceMedia(item.id, replacement.id);
      setDialog(null);
      if (!result.ok) {
        if (result.problem.status === 401) markSignedOut();
        toast.error(t("failed"));
        return;
      }
      const { replaced, failed } = result.data;
      if (failed.length)
        toast.warning(t("replacedPartly", { done: replaced, failed: failed.length }));
      else toast.success(t("replaced", { count: replaced }));
      setUsageVersion((now) => now + 1);
      router.refresh();
    });
  };

  const remove = () =>
    startWorking(async () => {
      const result = await removeMedia(item.id);
      setDialog(null);
      if (!result.ok) {
        if (result.problem.status === 401) markSignedOut();
        toast.error(
          result.problem.status === 409 ? t("deleteBlocked", { count: uses }) : t("failed"),
        );
        return;
      }
      toast.success(t("deleted"));
      onOpenChange(false);
      router.refresh();
      requestAnimationFrame(() => document.getElementById("media-search")?.focus());
    });

  const placeOf = (use: MediaUse) =>
    use.area === "setting" || !use.recordId
      ? `/secure-admin-control/content/${use.key}`
      : `/secure-admin-control/content/${use.key}/${encodeURIComponent(use.recordId)}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto data-[side=right]:max-w-xl data-[side=right]:sm:w-[34rem]">
        <SheetHeader className="pr-12">
          <SheetTitle className="line-clamp-2">{name}</SheetTitle>
          <SheetDescription>
            {item.kind === "photo" ? t("photo") : t("video")} · {formatBytes(item.bytes)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-6 pb-8">
          <div className="overflow-hidden rounded-xl bg-mist-100 ring-1 ring-mist-200">
            {item.kind === "video" ? (
              <video
                src={item.url}
                controls
                muted
                playsInline
                preload="metadata"
                aria-label={t("preview")}
                className="aspect-video w-full bg-midnight-950 object-contain"
              />
            ) : (
              <span
                className="relative block w-full"
                style={{
                  aspectRatio:
                    item.width && item.height ? `${item.width} / ${item.height}` : "4 / 3",
                }}
              >
                <MediaThumb
                  url={item.url}
                  kind="photo"
                  alt={t("preview")}
                  sizes="(min-width: 640px) 34rem, 100vw"
                />
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => void copy()}>
              <Copy aria-hidden="true" className="size-4" />
              {t("copy")}
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href={item.url} target="_blank" rel="noopener">
                <ExternalLink aria-hidden="true" className="size-4" />
                {t("openFile")}
              </a>
            </Button>
            {item.kind === "photo" ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUsed((now) => ({ ...now, crop: true }));
                  setDialog("crop");
                }}
              >
                <Crop aria-hidden="true" className="size-4" />
                {t("crop")}
              </Button>
            ) : null}
          </div>

          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (altOk && changed) save();
            }}
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor={altId} className="text-[14px] font-semibold text-navy-900">
                {t("alt")}
              </label>
              <p id={`${altId}-help`} className="-mt-0.5 text-[13.5px] leading-snug text-mist-600">
                {t("altHelp")}
              </p>
              <Input
                id={altId}
                value={alt}
                maxLength={200}
                aria-describedby={`${altId}-help${altOk ? "" : ` ${altId}-error`}`}
                aria-invalid={altOk ? undefined : true}
                onChange={(event) => setAlt(event.target.value)}
                className="h-11"
              />
              {altOk ? null : (
                <p id={`${altId}-error`} className="text-[13px] font-medium text-danger-700">
                  {t("altRequired")}
                </p>
              )}
            </div>
            <details
              className="rounded-lg border border-mist-200 px-3 py-1 open:pb-3"
              open={Boolean(item.credit)}
            >
              <summary className="min-h-11 cursor-pointer content-center text-[14px] font-semibold text-navy-900">
                {t("credit")}
              </summary>
              <div className="mt-2 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={creditId} className="text-[14px] font-semibold text-navy-900">
                    {t("creditName")}
                  </label>
                  <Input
                    id={creditId}
                    value={credit}
                    maxLength={120}
                    onChange={(event) => setCredit(event.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={creditUrlId} className="text-[14px] font-semibold text-navy-900">
                    {t("creditUrl")}
                  </label>
                  <Input
                    id={creditUrlId}
                    type="url"
                    inputMode="url"
                    value={creditUrl}
                    onChange={(event) => setCreditUrl(event.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
            </details>
            <div>
              <Button type="submit" size="sm" loading={saving} disabled={!altOk || !changed}>
                {t("save")}
              </Button>
            </div>
          </form>

          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-[13.5px]">
            {item.kind === "photo" ? (
              <>
                <dt className="text-mist-600">{t("dimensions")}</dt>
                <dd className="text-navy-900 tabular-nums">
                  {item.width} × {item.height} px
                </dd>
              </>
            ) : null}
            <dt className="text-mist-600">{t("fileSize")}</dt>
            <dd className="text-navy-900 tabular-nums">{formatBytes(item.bytes)}</dd>
            <dt className="text-mist-600">{t("type")}</dt>
            <dd className="text-navy-900">{item.mime}</dd>
            <dt className="text-mist-600">{t("uploaded")}</dt>
            <dd className="text-navy-900">
              {item.uploadedBy
                ? t("by", { when: item.createdLabel, name: item.uploadedBy })
                : item.createdLabel}
            </dd>
            {item.originalName ? (
              <>
                <dt className="text-mist-600">{t("original")}</dt>
                <dd className="break-all text-navy-900">{item.originalName}</dd>
              </>
            ) : null}
          </dl>

          <section aria-labelledby={`${altId}-usage`} className="flex flex-col gap-2">
            <h3 id={`${altId}-usage`} className="text-[15px] font-semibold text-navy-900">
              {t("usage")}
            </h3>
            {usage.status === "loading" ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-11 w-full rounded-lg" />
                <Skeleton className="h-11 w-2/3 rounded-lg" />
              </div>
            ) : usage.status === "failed" ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[13.5px] text-danger-700">{t("usageFailed")}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setUsageVersion((now) => now + 1)}
                >
                  <RotateCcw aria-hidden="true" className="size-4" />
                  {t("retry")}
                </Button>
              </div>
            ) : usage.items.length === 0 ? (
              <p className="text-[13.5px] text-mist-600">{t("usageNone")}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-mist-100 rounded-lg border border-mist-200">
                {usage.items.map((use) => (
                  <li key={`${use.key}-${use.recordId ?? ""}-${use.field}`}>
                    <Link
                      href={placeOf(use)}
                      prefetch={false}
                      className="flex min-h-11 flex-col justify-center gap-0.5 px-3 py-2 hover:bg-mist-50 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                    >
                      <span className="text-[14px] font-medium text-navy-900">
                        {use.area === "setting" ? (keyNames[use.key] ?? use.title) : use.title}
                      </span>
                      <span className="text-[12.5px] text-mist-600">
                        {use.area === "setting"
                          ? t("usageSetting")
                          : (keyNames[use.key] ?? use.key)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {uses === 0 ? null : (
            <section className="flex flex-col gap-3 rounded-xl border border-mist-200 p-3">
              <div className="flex flex-col gap-1">
                <h3 className="text-[15px] font-semibold text-navy-900">{t("replace")}</h3>
                <p className="text-[13.5px] text-mist-600">{t("replaceHelp")}</p>
              </div>
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setUsed((now) => ({ ...now, picker: true }));
                    setDialog("picker");
                  }}
                >
                  <RefreshCw aria-hidden="true" className="size-4" />
                  {t("replaceButton")}
                </Button>
              </div>
            </section>
          )}

          {canDelete ? (
            <section className="flex flex-col gap-2">
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={uses > 0 || usage.status !== "ready"}
                  onClick={() => setDialog("confirmDelete")}
                  className="text-danger-700"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                  {t("delete")}
                </Button>
              </div>
              {uses > 0 ? (
                <p className="text-[13px] text-mist-600">{t("deleteBlocked", { count: uses })}</p>
              ) : null}
            </section>
          ) : null}
        </div>

        {used.picker ? (
          <MediaPickerDialog
            open={dialog === "picker"}
            onOpenChange={(next) =>
              setDialog((now) => (next ? "picker" : now === "picker" ? null : now))
            }
            kind={item.kind}
            {...(item.kind === "video" ? { mime: item.mime } : {})}
            current={[item.url]}
            onChoose={([asset]) => {
              if (!asset || asset.id === item.id) return;
              setReplacement(asset);
              setDialog("confirmReplace");
            }}
          />
        ) : null}
        {used.crop && item.kind === "photo" ? (
          <ImageCropDialog
            open={dialog === "crop"}
            onOpenChange={(next) =>
              setDialog((now) => (next ? "crop" : now === "crop" ? null : now))
            }
            id={item.id}
            src={item.url}
            size={{ width: item.width, height: item.height }}
            aspect={null}
            onCropped={() => router.refresh()}
          />
        ) : null}

        <AlertDialog
          open={dialog === "confirmReplace"}
          onOpenChange={(next) => (next || working ? undefined : setDialog(null))}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("replaceConfirmTitle", { count: uses })}</AlertDialogTitle>
              <AlertDialogDescription>{t("replaceConfirmBody")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={working}>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                disabled={working}
                onClick={(event) => {
                  event.preventDefault();
                  replace();
                }}
              >
                {t("replaceConfirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={dialog === "confirmDelete"}
          onOpenChange={(next) => (next || working ? undefined : setDialog(null))}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
              <AlertDialogDescription>{t("deleteConfirmBody")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={working}>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                variant="danger"
                disabled={working}
                onClick={(event) => {
                  event.preventDefault();
                  remove();
                }}
              >
                {t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}

export { MediaDetailsSheet };
