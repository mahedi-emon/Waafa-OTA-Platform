"use client";

import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Library,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Star,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { isTooSmall } from "@waafa/shared/helpers/media";
import { MediaDropzone } from "@/components/admin/media/MediaDropzone";
import { MediaThumb } from "@/components/admin/media/MediaThumb";
import { photoFromAsset, type StoredPhoto } from "@/components/admin/media/photoFromAsset";
import { altFromName } from "@/components/admin/media/uploadMedia";
import { useProblemText } from "@/components/admin/media/useProblemText";
import { useUploadQueue } from "@/components/admin/media/useUploadQueue";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { headingOf } from "@/lib/admin/blueprints/display";
import { childPattern, dottedOf } from "@/lib/admin/blueprints/paths";
import { frameRatioCss, suggestAlt } from "@/lib/admin/photoFrame";
import { resolve, type JsonSchema, type Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { MediaField } from "./MediaField";
import { SortableList } from "./SortableList";
import { useField } from "./useField";
import { useSchemaEditor } from "./useSchemaEditor";
import { useStableKeys } from "./useStableKeys";

const MediaPickerDialog = dynamic(
  () =>
    import("@/components/admin/media/MediaPickerDialog").then((module) => module.MediaPickerDialog),
  { ssr: false },
);

type GalleryFieldProps = {
  path: Path;
  node: JsonSchema;
  value: unknown;
  optional: boolean;
};

const TILE_SIZES = "(min-width: 1280px) 220px, (min-width: 640px) 30vw, 45vw";

/**
 * Many photos (ADMIN.md §6): drop or paste several at once, choose several from the library, drag into order (or
 * Move earlier / later), the first is the cover, and each photo has its own description, crop and focal point in a
 * side sheet. Removing one offers Undo.
 */
function GalleryField({ path, node, value, optional }: GalleryFieldProps) {
  const editor = useSchemaEditor();
  const meta = useField(path);
  const t = useTranslations("Admin.media.gallery");
  const problemText = useProblemText();
  const items = (Array.isArray(value) ? value : []) as StoredPhoto[];
  const stable = useStableKeys(items.length);
  const itemNode = resolve(
    (Array.isArray(node.items) ? node.items[0] : node.items) ?? {},
    editor.root,
  );
  const parts = new Set(Object.keys(itemNode.properties ?? {}));
  const frame =
    editor.blueprint.fields[childPattern(meta.pattern, "item")]?.frame ?? meta.field.frame;
  const max = typeof node.maxItems === "number" ? node.maxItems : Number.POSITIVE_INFINITY;
  const room = Math.max(0, max - items.length);
  const [pickerUsed, setPickerUsed] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const title = headingOf(editor.blueprint, editor.value) || undefined;

  const append = (photos: StoredPhoto[]) => {
    if (photos.length === 0) return;
    editor.update(path, (current) => {
      const list = Array.isArray(current) ? [...current] : [];
      for (const photo of photos) {
        if (list.length >= max) break;
        stable.insert(list.length);
        list.push(photo);
      }
      return list;
    });
  };
  const uploads = useUploadQueue({
    altFor: (file) => suggestAlt(title, altFromName(file.name)),
    onUploaded: (asset) => append([photoFromAsset(asset, parts)]),
  });
  const pending = uploads.items.filter((item) => item.status !== "done");
  const send = (files: File[]) => {
    uploads.clearDone();
    uploads.add(files.slice(0, Math.max(0, room - pending.length)));
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    if (moved === undefined) return;
    next.splice(to, 0, moved);
    stable.move(from, to);
    editor.change(path, next);
  };
  const nameOf = (index: number) => t("photoN", { n: index + 1 });
  const remove = (index: number) => {
    const removed = items[index];
    stable.remove(index);
    editor.change(
      path,
      items.filter((_, position) => position !== index),
    );
    toast(t("removed", { n: index + 1 }), {
      action: {
        label: t("undo"),
        onClick: () => {
          stable.insert(index);
          editor.update(path, (current) => {
            const list = Array.isArray(current) ? [...current] : [];
            list.splice(Math.min(index, list.length), 0, removed);
            return list;
          });
        },
      },
    });
  };
  /** A photo with a problem in it is marked, so the error's link has somewhere to go. */
  const hasProblem = (index: number) => {
    const item = dottedOf([...path, index]);
    for (const at of editor.errors.keys())
      if (at === item || at.startsWith(`${item}.`)) return true;
    return false;
  };

  const tile = (index: number, handle: ReactNode) => {
    const photo = items[index] ?? {};
    const alt = photo.alt?.trim() ?? "";
    const small =
      Boolean(frame && photo.width && photo.height) &&
      isTooSmall(
        { width: photo.width ?? 0, height: photo.height ?? 0 },
        { width: frame?.minWidth ?? 0 },
      );
    const problem = hasProblem(index);
    const name = nameOf(index);
    return (
      <div
        id={`${meta.id}-${index}`}
        className={
          problem
            ? "flex min-w-0 flex-col overflow-hidden rounded-xl border border-danger-600 bg-white ring-1 ring-danger-600"
            : "flex min-w-0 flex-col overflow-hidden rounded-xl border border-mist-200 bg-white"
        }
      >
        <div
          className="relative w-full overflow-hidden bg-mist-100"
          style={{ aspectRatio: frameRatioCss(frame, photo) }}
        >
          {photo.src ? (
            <MediaThumb
              url={photo.src}
              kind="photo"
              alt=""
              sizes={TILE_SIZES}
              focal={photo.focal}
            />
          ) : null}
          {index === 0 ? (
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-midnight-950/80 px-2 py-0.5 text-[12px] font-semibold text-white">
              <Star aria-hidden="true" className="size-3.5" />
              {t("cover")}
            </span>
          ) : null}
          <div className="absolute top-1.5 right-1.5 left-1.5 flex items-start justify-between gap-1">
            {handle ? <span className="rounded-lg bg-white/95 shadow-sm">{handle}</span> : <span />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="white"
                  size="icon-sm"
                  aria-label={t("actions", { name })}
                  className="shadow-sm"
                >
                  <MoreHorizontal aria-hidden="true" className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuItem onSelect={() => setEditing(index)}>
                  <Pencil aria-hidden="true" />
                  {t("edit")}
                </DropdownMenuItem>
                <DropdownMenuItem disabled={index === 0} onSelect={() => move(index, 0)}>
                  <Star aria-hidden="true" />
                  {t("makeCover")}
                </DropdownMenuItem>
                <DropdownMenuItem disabled={index === 0} onSelect={() => move(index, index - 1)}>
                  <ArrowLeft aria-hidden="true" />
                  {t("earlier")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={index === items.length - 1}
                  onSelect={() => move(index, index + 1)}
                >
                  <ArrowRight aria-hidden="true" />
                  {t("later")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => remove(index)}>
                  <Trash2 aria-hidden="true" />
                  {t("remove")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing(index)}
          className="flex min-h-11 min-w-0 flex-1 cursor-pointer flex-col items-start gap-0.5 px-2.5 py-2 text-left outline-none hover:bg-mist-50 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:ring-inset"
        >
          <span className="sr-only">{`${t("edit")}: ${name}`}</span>
          <span
            className={
              alt
                ? "line-clamp-2 text-[13px] text-navy-900"
                : "text-[13px] font-medium text-warning-800"
            }
          >
            {alt || t("missingAlt")}
          </span>
          {small && photo.width ? (
            <span className="inline-flex items-center gap-1 text-[12px] font-medium text-warning-800 tabular-nums">
              <TriangleAlert aria-hidden="true" className="size-3.5" />
              {t("small", { width: photo.width })}
            </span>
          ) : null}
        </button>
      </div>
    );
  };

  const hint = [
    frame
      ? frame.aspect === "free"
        ? t("frameFree", { width: frame.minWidth })
        : t("frame", { aspect: frame.aspect, width: frame.minWidth })
      : "",
    t("order"),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      help={[meta.help, hint].filter(Boolean).join(" ")}
      optional={optional}
      {...(meta.error ? { error: meta.error } : {})}
      group
      actions={
        items.length > 0 ? (
          <span className="text-[12.5px] text-mist-600 tabular-nums">
            {t("count", { count: items.length })}
          </span>
        ) : null
      }
    >
      <div className="@container flex min-w-0 flex-col gap-3">
        {items.length > 0 ? (
          <SortableList
            keys={stable.keys}
            onMove={move}
            nameOf={nameOf}
            layout="grid"
            className="grid grid-cols-2 gap-3 @md:grid-cols-3 @3xl:grid-cols-4"
            renderItem={tile}
          />
        ) : null}

        {pending.length > 0 ? (
          <ul
            aria-label={t("uploads")}
            className="grid grid-cols-2 gap-3 @md:grid-cols-3 @3xl:grid-cols-4"
          >
            {pending.map((item) => (
              <li
                key={item.key}
                className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-mist-200 bg-white"
              >
                <div
                  className="relative w-full bg-mist-100"
                  style={{ aspectRatio: frameRatioCss(frame) }}
                >
                  {item.preview ? (
                    // A local preview of the file on its way (a blob: address next/image can't load).
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.preview} alt="" className="size-full object-cover opacity-60" />
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-col gap-1.5 p-2.5">
                  <span className="truncate text-[13px] text-navy-900">{item.file.name}</span>
                  {item.status === "failed" ? (
                    <>
                      <span role="alert" className="text-[12.5px] font-medium text-danger-700">
                        {problemText(item.problem, "photo")}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => uploads.retry(item.key)}
                        >
                          <RotateCcw aria-hidden="true" className="size-4" />
                          {t("retry")}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("dismiss", { name: item.file.name })}
                          onClick={() => uploads.dismiss(item.key)}
                        >
                          <X aria-hidden="true" className="size-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Progress
                        value={Math.round(item.progress * 100)}
                        aria-label={t("progress", { name: item.file.name })}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("cancel", { name: item.file.name })}
                        onClick={() => uploads.dismiss(item.key)}
                      >
                        <X aria-hidden="true" className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {room > 0 ? (
          <MediaDropzone
            kind="photo"
            multiple
            onFiles={send}
            compact={items.length > 0}
            title={items.length ? t("dropMore") : t("drop")}
            hint={t("types")}
          >
            {(browse) => (
              <>
                <Button type="button" size="sm" onClick={browse}>
                  <ImagePlus aria-hidden="true" className="size-4" />
                  {t("upload")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setPickerUsed(true);
                    setPickerOpen(true);
                  }}
                >
                  <Library aria-hidden="true" className="size-4" />
                  {t("library")}
                </Button>
              </>
            )}
          </MediaDropzone>
        ) : (
          <p className="text-[13.5px] text-mist-600">{t("full", { max })}</p>
        )}
      </div>

      {pickerUsed ? (
        <MediaPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          kind="photo"
          multiple
          minWidth={frame?.minWidth}
          current={items.map((item) => item.src ?? "").filter(Boolean)}
          title={title}
          onChoose={(assets) => append(assets.map((asset) => photoFromAsset(asset, parts)))}
        />
      ) : null}

      <Sheet open={editing !== null} onOpenChange={(next) => (next ? undefined : setEditing(null))}>
        <SheetContent className="w-full overflow-y-auto data-[side=right]:max-w-xl data-[side=right]:sm:w-[36rem]">
          <SheetHeader className="pr-12">
            <SheetTitle>{editing === null ? "" : nameOf(editing)}</SheetTitle>
            <SheetDescription>{t("editLead")}</SheetDescription>
          </SheetHeader>
          {editing !== null && items[editing] ? (
            <div className="px-4 pb-6">
              <MediaField
                path={[...path, editing]}
                node={itemNode}
                value={items[editing]}
                optional={false}
                nullable={false}
              />
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </FieldShell>
  );
}

export { GalleryField };
