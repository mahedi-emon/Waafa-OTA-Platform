"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import {
  Crop,
  Focus,
  ImageIcon,
  ImageUp,
  Library,
  RefreshCw,
  RotateCcw,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { MediaAsset } from "@waafa/shared";
import { isTooSmall, mediaIdOf } from "@waafa/shared/helpers/media";
import { MediaDropzone } from "@/components/admin/media/MediaDropzone";
import { MediaThumb } from "@/components/admin/media/MediaThumb";
import {
  onlyParts,
  photoFromAsset,
  type StoredPhoto,
} from "@/components/admin/media/photoFromAsset";
import { altFromName } from "@/components/admin/media/uploadMedia";
import { useProblemText } from "@/components/admin/media/useProblemText";
import { useUploadQueue } from "@/components/admin/media/useUploadQueue";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { headingOf } from "@/lib/admin/blueprints/display";
import type { PhotoFrame } from "@/lib/admin/blueprints/types";
import { isLinkablePhoto } from "@/lib/admin/mediaAddress";
import { frameRatioCss, ratioOf, suggestAlt } from "@/lib/admin/photoFrame";
import { getAt, resolve, type JsonSchema, type Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { fieldId } from "./fieldIds";
import { TextField } from "./TextField";
import { useField } from "./useField";
import { useSchemaEditor } from "./useSchemaEditor";

// The library, the cropper and the focal point load the first time staff open them (D202).
const MediaPickerDialog = dynamic(
  () =>
    import("@/components/admin/media/MediaPickerDialog").then((module) => module.MediaPickerDialog),
  { ssr: false },
);
const ImageCropDialog = dynamic(
  () => import("@/components/admin/media/ImageCropDialog").then((module) => module.ImageCropDialog),
  { ssr: false },
);
const FocalPointDialog = dynamic(
  () =>
    import("@/components/admin/media/FocalPointDialog").then((module) => module.FocalPointDialog),
  { ssr: false },
);

type MediaFieldProps = {
  path: Path;
  node: JsonSchema;
  value: unknown;
  optional: boolean;
  nullable: boolean;
};

type Photo = StoredPhoto;

type Dialog = "library" | "crop" | "focal";

const NAME_FIELDS = ["name", "title", "caption", "label", "heading", "question"];

const textOf = (value: unknown, names: string[]): string | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  for (const name of names) {
    const text = record[name];
    if (typeof text === "string" && text.trim()) return text.trim();
  }
  return undefined;
};

/**
 * One photo (ADMIN.md §6 and §11): drop, paste, upload or choose it from the library; it is drawn in the frame it
 * shows in on the site with its minimum width; crop and focal point; alt text suggested from the record's title;
 * credit and a web address folded away. Sizes are measured, never typed.
 */
function MediaField({ path, node, value, optional, nullable }: MediaFieldProps) {
  const editor = useSchemaEditor();
  const meta = useField(path);
  const srcMeta = useField([...path, "src"]);
  const t = useTranslations("Admin.media.field");
  const problemText = useProblemText();
  const photo = value && typeof value === "object" ? (value as Photo) : null;
  const src = photo?.src?.trim() ?? "";
  const frame: PhotoFrame | undefined = meta.field.frame;
  const allowed = new Set(Object.keys(node.properties ?? {}));
  const child = (name: string) => resolve(node.properties?.[name] ?? {}, editor.root);
  const [opened, setOpened] = useState<Set<Dialog>>(() => new Set());
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const open = (next: Dialog) => {
    setOpened((now) => (now.has(next) ? now : new Set(now).add(next)));
    setDialog(next);
  };

  // The words a new photo is described with until staff improve them: the item's own name, else the record's.
  const title =
    textOf(getAt(editor.value, path.slice(0, -1)), NAME_FIELDS) ??
    (headingOf(editor.blueprint, editor.value) || undefined);

  const only = (next: Photo): Photo => onlyParts(next, allowed);
  const applyAsset = (asset: MediaAsset) => meta.change(photoFromAsset(asset, allowed));

  const uploads = useUploadQueue({
    altFor: (file) => suggestAlt(title, altFromName(file.name)),
    onUploaded: (asset) => {
      applyAsset(asset);
      uploads.clearDone();
    },
  });
  const upload = uploads.items.at(-1);
  const send = (files: File[]) => {
    for (const item of uploads.items) uploads.dismiss(item.key);
    if (files[0]) uploads.add([files[0]]);
  };

  // The address box keeps what staff type; only an address the public pages can show is stored (a site path, or
  // Unsplash and Pexels over https: the image optimiser fetches nothing else).
  const [address, setAddress] = useState(src);
  const [addressOf, setAddressOf] = useState(src);
  if (src !== addressOf) {
    setAddressOf(src);
    setAddress(src);
  }
  const addressProblem = address.trim() && !isLinkablePhoto(address) ? t("linkHosts") : undefined;
  const link = (next: string) => {
    if (!isLinkablePhoto(next)) {
      toast.error(t("linkHosts"));
      return;
    }
    const { width: _width, height: _height, focal: _focal, ...rest } = photo ?? {};
    meta.change(only({ ...rest, src: next.trim(), alt: photo?.alt ?? "" }));
  };

  // A photo staff set by its web address gets its size measured once it loads. The address the record came with is
  // left alone: measuring it would mark an untouched record as changed.
  const measured = Boolean(photo?.width && photo.height);
  const arrived = useRef(src);
  useEffect(() => {
    if (!src || measured || src === arrived.current || !isLinkablePhoto(src)) return;
    let live = true;
    const probe = new window.Image();
    probe.onload = () => {
      if (!live || !probe.naturalWidth) return;
      editor.update(path, (current) =>
        current && typeof current === "object" && (current as Photo).src?.trim() === src
          ? { ...(current as Photo), width: probe.naturalWidth, height: probe.naturalHeight }
          : current,
      );
    };
    probe.src = src;
    return () => {
      live = false;
    };
    // editor.update builds on the latest value; path is stable for this field.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, measured]);

  const ratio = frameRatioCss(frame, photo ?? undefined);
  const frameLine = frame
    ? frame.aspect === "free"
      ? t("frameFree", { width: frame.minWidth })
      : t("frame", { aspect: frame.aspect, width: frame.minWidth })
    : "";
  const small =
    Boolean(frame && photo?.width && photo.height) &&
    isTooSmall(
      { width: photo?.width ?? 0, height: photo?.height ?? 0 },
      { width: frame?.minWidth ?? 0 },
    );
  const libraryId = src ? mediaIdOf(src) : null;
  const busy = upload?.status === "waiting" || upload?.status === "uploading";
  const failed = upload?.status === "failed" ? upload : undefined;
  const srcId = fieldId([...path, "src"]);

  const remove =
    optional || nullable ? (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => meta.change(optional ? undefined : null)}
      >
        <Trash2 aria-hidden="true" className="size-4" />
        {t("remove")}
      </Button>
    ) : null;

  const dialogs = (
    <>
      {opened.has("library") ? (
        <MediaPickerDialog
          open={dialog === "library"}
          onOpenChange={(next) =>
            setDialog((now) => (next ? "library" : now === "library" ? null : now))
          }
          kind="photo"
          minWidth={frame?.minWidth}
          current={src ? [src] : []}
          title={title}
          returnFocus={() => document.getElementById(fieldId([...path, "alt"]))}
          onChoose={([asset]) => {
            if (asset) applyAsset(asset);
          }}
        />
      ) : null}
      {opened.has("crop") && libraryId && photo ? (
        <ImageCropDialog
          open={dialog === "crop"}
          onOpenChange={(next) => setDialog((now) => (next ? "crop" : now === "crop" ? null : now))}
          id={libraryId}
          src={src}
          size={
            photo.width && photo.height ? { width: photo.width, height: photo.height } : undefined
          }
          aspect={frame ? ratioOf(frame.aspect) : null}
          minWidth={frame?.minWidth}
          onCropped={(asset) => {
            const { focal: _focal, ...rest } = photo;
            meta.change(
              only({ ...rest, src: asset.url, width: asset.width, height: asset.height }),
            );
          }}
        />
      ) : null}
      {opened.has("focal") && src ? (
        <FocalPointDialog
          open={dialog === "focal"}
          onOpenChange={(next) =>
            setDialog((now) => (next ? "focal" : now === "focal" ? null : now))
          }
          src={src}
          alt={photo?.alt ?? ""}
          value={photo?.focal}
          onChange={(focal) => {
            if (!photo) return;
            const { focal: _old, ...rest } = photo;
            meta.change(focal ? { ...rest, focal } : rest);
          }}
        />
      ) : null}
    </>
  );

  // A missing or broken address is the photo's own problem: shown under the drop zone or the address box.
  const srcProblem = srcMeta.error ? (
    <p id={`${srcId}-error`} role="alert" className="text-[13px] font-medium text-danger-700">
      {srcMeta.error}
    </p>
  ) : null;

  // No photo yet, or one on its way.
  if (!src) {
    return (
      <>
        <FieldShell
          id={meta.id}
          label={meta.label}
          {...(meta.help ? { help: meta.help } : {})}
          optional={optional}
          {...(meta.error ? { error: meta.error } : {})}
          group
          actions={photo ? remove : null}
        >
          {upload && (busy || failed) ? (
            <div
              className="relative w-full max-w-80 overflow-hidden rounded-xl border border-mist-200 bg-mist-100"
              style={{ aspectRatio: ratio }}
            >
              {upload.preview ? (
                // A local preview of the file on its way (a blob: address next/image can't load).
                // eslint-disable-next-line @next/next/no-img-element
                <img src={upload.preview} alt="" className="size-full object-cover opacity-60" />
              ) : null}
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-white/95 p-3">
                {failed ? (
                  <>
                    <p
                      role="alert"
                      className="flex items-start gap-2 text-[13.5px] font-medium text-danger-700"
                    >
                      <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                      {problemText(failed.problem, "photo")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => uploads.retry(failed.key)}
                      >
                        <RotateCcw aria-hidden="true" className="size-4" />
                        {t("retry")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => uploads.dismiss(failed.key)}
                      >
                        {t("chooseAnother")}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3 text-[13.5px] text-navy-900">
                      <span className="tabular-nums">
                        {t("uploading", { percent: Math.round(upload.progress * 100) })}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => uploads.dismiss(upload.key)}
                      >
                        <X aria-hidden="true" className="size-4" />
                        {t("cancel")}
                      </Button>
                    </div>
                    <Progress
                      value={Math.round(upload.progress * 100)}
                      aria-label={t("progress")}
                    />
                  </>
                )}
              </div>
            </div>
          ) : (
            <MediaDropzone
              id={srcId}
              kind="photo"
              onFiles={send}
              onLink={link}
              title={t("drop")}
              hint={[frameLine, t("types")].filter(Boolean).join(" · ")}
              {...(srcMeta.error ? { describedBy: `${srcId}-error` } : {})}
              className="max-w-xl"
            >
              {(browse) => (
                <>
                  <Button type="button" size="sm" onClick={browse}>
                    <ImageUp aria-hidden="true" className="size-4" />
                    {t("upload")}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => open("library")}
                  >
                    <Library aria-hidden="true" className="size-4" />
                    {t("library")}
                  </Button>
                </>
              )}
            </MediaDropzone>
          )}
          {srcProblem}
        </FieldShell>
        {dialogs}
      </>
    );
  }

  return (
    <>
      <FieldShell
        id={meta.id}
        label={meta.label}
        {...(meta.help ? { help: meta.help } : {})}
        optional={optional}
        {...(meta.error ? { error: meta.error } : {})}
        group
        actions={remove}
      >
        <div className="@container min-w-0">
          <div className="grid min-w-0 grid-cols-1 gap-4 rounded-xl border border-mist-200 bg-white p-3 sm:p-4 @xl:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)]">
            <div className="flex w-full max-w-80 min-w-0 flex-col gap-2">
              <MediaDropzone
                kind="photo"
                onFiles={send}
                title={t("dropReplace")}
                hint=""
                covered
                className="w-full overflow-hidden rounded-lg ring-1 ring-mist-200"
                style={{ aspectRatio: ratio }}
              >
                {() =>
                  isLinkablePhoto(src) || /^https:\/\//.test(src) ? (
                    <MediaThumb
                      url={src}
                      kind="photo"
                      alt={t("preview")}
                      sizes="320px"
                      focal={photo?.focal}
                    />
                  ) : (
                    <span className="flex size-full flex-col items-center justify-center gap-1 bg-mist-100 text-[12.5px] text-mist-600">
                      <ImageIcon aria-hidden="true" className="size-6" />
                      {t("noPreview")}
                    </span>
                  )
                }
              </MediaDropzone>
              {busy && upload ? (
                <Progress value={Math.round(upload.progress * 100)} aria-label={t("progress")} />
              ) : null}
              <p className="text-[12.5px] leading-snug text-mist-600 tabular-nums">
                {[
                  frameLine,
                  photo?.width && photo.height
                    ? t("size", { width: photo.width, height: photo.height })
                    : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="secondary" size="sm" loading={busy}>
                      <RefreshCw aria-hidden="true" className="size-4" />
                      {t("replace")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onSelect={() => document.getElementById(`${srcId}-file`)?.click()}
                    >
                      <ImageUp aria-hidden="true" className="size-4" />
                      {t("replaceUpload")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => open("library")}>
                      <Library aria-hidden="true" className="size-4" />
                      {t("library")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <input
                  id={`${srcId}-file`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  tabIndex={-1}
                  aria-hidden="true"
                  className="sr-only"
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    event.target.value = "";
                    send(files);
                  }}
                />
                {libraryId ? (
                  <Button type="button" variant="secondary" size="sm" onClick={() => open("crop")}>
                    <Crop aria-hidden="true" className="size-4" />
                    {t("crop")}
                  </Button>
                ) : null}
                <Button type="button" variant="secondary" size="sm" onClick={() => open("focal")}>
                  <Focus aria-hidden="true" className="size-4" />
                  {t("focal")}
                </Button>
              </div>
              {failed ? (
                <div className="flex flex-col gap-1.5">
                  <p role="alert" className="text-[13px] font-medium text-danger-700">
                    {problemText(failed.problem, "photo")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => uploads.retry(failed.key)}
                    >
                      <RotateCcw aria-hidden="true" className="size-4" />
                      {t("retry")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => uploads.dismiss(failed.key)}
                    >
                      <X aria-hidden="true" className="size-4" />
                      {t("dismiss")}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              {small && photo?.width && frame ? (
                <p className="flex items-start gap-2 rounded-lg bg-warning-50 px-3 py-2 text-[13.5px] leading-snug text-warning-800">
                  <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  {t("tooSmall", { width: photo.width, min: frame.minWidth })}
                </p>
              ) : null}
              <TextField
                path={[...path, "alt"]}
                node={child("alt")}
                value={photo?.alt}
                optional={false}
                nullable={false}
                {...(photo?.alt?.trim()
                  ? {}
                  : { describedBy: `${fieldId([...path, "alt"])}-missing` })}
              />
              {!photo?.alt?.trim() ? (
                <p
                  id={`${fieldId([...path, "alt"])}-missing`}
                  className="-mt-2.5 text-[13px] font-medium text-warning-800"
                >
                  {t("altMissing")}
                </p>
              ) : null}
              {allowed.has("credit") ? (
                <details className="rounded-lg border border-mist-200 px-3 py-1 open:pb-3">
                  <summary className="min-h-11 cursor-pointer content-center text-[14px] font-semibold text-navy-900">
                    {t("credit")}
                  </summary>
                  <div className="mt-2 flex flex-col gap-4">
                    <TextField
                      path={[...path, "credit"]}
                      node={child("credit")}
                      value={photo?.credit}
                      optional
                      nullable={false}
                    />
                    {allowed.has("creditUrl") ? (
                      <TextField
                        path={[...path, "creditUrl"]}
                        node={child("creditUrl")}
                        value={photo?.creditUrl}
                        optional
                        nullable={false}
                      />
                    ) : null}
                  </div>
                </details>
              ) : null}
              <details
                className="rounded-lg border border-mist-200 px-3 py-1 open:pb-3"
                open={Boolean(srcMeta.error || addressProblem)}
              >
                <summary className="min-h-11 cursor-pointer content-center text-[14px] font-semibold text-navy-900">
                  {t("link")}
                </summary>
                <div className="mt-2 flex flex-col gap-1.5">
                  <label htmlFor={srcId} className="text-[14px] font-semibold text-navy-900">
                    {t("address")}
                  </label>
                  <Input
                    id={srcId}
                    value={address}
                    spellCheck={false}
                    inputMode="url"
                    aria-describedby={
                      [srcMeta.error ? `${srcId}-error` : "", addressProblem ? `${srcId}-host` : ""]
                        .filter(Boolean)
                        .join(" ") || undefined
                    }
                    aria-invalid={srcMeta.error || addressProblem ? true : undefined}
                    onChange={(event) => {
                      const next = event.target.value;
                      setAddress(next);
                      if (isLinkablePhoto(next) && next.trim() !== src) {
                        const {
                          width: _width,
                          height: _height,
                          focal: _focal,
                          ...rest
                        } = photo ?? {};
                        meta.change({ ...rest, src: next.trim() });
                      }
                    }}
                    onBlur={() => editor.touch([...path, "src"])}
                  />
                  {srcProblem}
                  {addressProblem ? (
                    <p
                      id={`${srcId}-host`}
                      role="alert"
                      className="text-[13px] font-medium text-danger-700"
                    >
                      {addressProblem}
                    </p>
                  ) : null}
                  <p className="text-[13px] text-mist-600">{t("linkHint")}</p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </FieldShell>
      {dialogs}
    </>
  );
}

export { MediaField };
