"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { Clapperboard, Library, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { MediaAsset } from "@waafa/shared";
import { MediaDropzone } from "@/components/admin/media/MediaDropzone";
import { photoFromAsset } from "@/components/admin/media/photoFromAsset";
import { posterFromVideo } from "@/components/admin/media/posterFromVideo";
import { altFromName, uploadMedia } from "@/components/admin/media/uploadMedia";
import { useUploadQueue } from "@/components/admin/media/useUploadQueue";
import { VideoFileSlot, type VideoFormat } from "@/components/admin/media/VideoFileSlot";
import { Button } from "@/components/ui/button";
import { headingOf } from "@/lib/admin/blueprints/display";
import { childPattern, dottedOf } from "@/lib/admin/blueprints/paths";
import { isLinkableVideo } from "@/lib/admin/mediaAddress";
import { suggestAlt } from "@/lib/admin/photoFrame";
import { getAt, resolve, type JsonSchema, type Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { fieldId } from "./fieldIds";
import { SchemaField } from "./SchemaField";
import { useField } from "./useField";
import { useSchemaEditor } from "./useSchemaEditor";

const MediaPickerDialog = dynamic(
  () =>
    import("@/components/admin/media/MediaPickerDialog").then((module) => module.MediaPickerDialog),
  { ssr: false },
);

type VideoFieldProps = {
  path: Path;
  node: JsonSchema;
  value: unknown;
  optional: boolean;
  nullable: boolean;
};

type Part = "mp4" | "webm" | "mp4Mobile" | "webmMobile";
type Video = Partial<Record<Part, string>> & { poster?: { src?: string; alt?: string } };

const FORMAT: Record<Part, VideoFormat> = {
  mp4: "mp4",
  webm: "webm",
  mp4Mobile: "mp4",
  webmMobile: "webm",
};
const MAIN: Part[] = ["mp4", "webm"];
const PHONE: Part[] = ["mp4Mobile", "webmMobile"];
/** The rest of a video is drawn by the usual widgets, in this order. */
const REST = ["caption"];
const CREDIT = ["credit", "creditUrl"];

/**
 * A muted loop or clip (ADMIN.md §6 and §11): MP4 (plays everywhere) and an optional WebM, uploaded up to 50 MB,
 * chosen from the library or linked; lighter phone versions folded away; a poster taken from the clip itself when
 * none is set yet (still real footage), changeable like any photo.
 */
function VideoField({ path, node, value, optional, nullable }: VideoFieldProps) {
  const editor = useSchemaEditor();
  const meta = useField(path);
  const t = useTranslations("Admin.media.video");
  const video = value && typeof value === "object" ? (value as Video) : null;
  const parts = new Set(Object.keys(node.properties ?? {}));
  const required = new Set(node.required ?? []);
  const child = (name: string) => resolve(node.properties?.[name] ?? {}, editor.root);
  const posterNode = child("poster");
  const posterParts = new Set(Object.keys(posterNode.properties ?? {}));
  const title = headingOf(editor.blueprint, editor.value) || undefined;
  const [wrong, setWrong] = useState<Partial<Record<Part, string>>>({});
  // "auto": the empty field's library button; the chosen clip goes where its format belongs.
  const [picking, setPicking] = useState<Part | "auto" | null>(null);
  const [pickerUsed, setPickerUsed] = useState(false);
  const [posterBusy, setPosterBusy] = useState(false);
  // One poster at a time, even when the MP4 and the WebM arrive together (read and set in callbacks only).
  const posterJob = useRef(false);

  const setPart = (part: Part, next: string | undefined) =>
    editor.update(path, (current) => {
      const base: Record<string, unknown> =
        current && typeof current === "object"
          ? { ...(current as Record<string, unknown>) }
          : { poster: { src: "", alt: "" } };
      if (next === undefined) delete base[part];
      else base[part] = next;
      return base;
    });

  // A clip without a poster gets one from its own footage (a frame at one second).
  const makePoster = async (file: File) => {
    const current = getAt(editor.value, [...path, "poster", "src"]);
    if ((typeof current === "string" && current.trim()) || posterJob.current) return;
    posterJob.current = true;
    setPosterBusy(true);
    try {
      const still = await posterFromVideo(file);
      if (!still) return;
      const outcome = await uploadMedia(
        still,
        { alt: suggestAlt(title, altFromName(file.name)) },
        () => undefined,
      );
      if (!outcome.ok) return;
      editor.update([...path, "poster"], (now) => {
        const before = (now && typeof now === "object" ? now : {}) as {
          src?: string;
          alt?: string;
        };
        if (before.src?.trim()) return now;
        const poster = photoFromAsset(outcome.asset, posterParts);
        // Words staff typed for the poster meanwhile stay.
        return before.alt?.trim() ? { ...poster, alt: before.alt } : poster;
      });
      toast.success(t("posterMade"));
    } finally {
      posterJob.current = false;
      setPosterBusy(false);
    }
  };

  const uploads = useUploadQueue({
    altFor: (file) => suggestAlt(title, altFromName(file.name)),
    onUploaded: (asset, item) => {
      const part = item.tag as Part | undefined;
      if (!part) return;
      setPart(part, asset.url);
      if (part === "mp4" || part === "webm") void makePoster(item.file);
    },
  });
  const latestFor = (part: Part) =>
    uploads.items.filter((item) => item.tag === part && item.status !== "done").at(-1);

  const fits = (part: Part, type: string) => type === `video/${FORMAT[part]}`;
  const send = (part: Part, files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (!fits(part, file.type)) {
      setWrong((now) => ({
        ...now,
        [part]: t(`wrongFormat.${FORMAT[part]}`),
      }));
      return;
    }
    setWrong((now) => ({ ...now, [part]: undefined }));
    for (const item of uploads.items) if (item.tag === part) uploads.dismiss(item.key);
    uploads.add([file], part);
  };
  /** A file dropped on the whole field goes where its format belongs. */
  const sendAny = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    send(file.type === "video/webm" ? "webm" : "mp4", [file]);
  };
  const choose = (part: Part, asset: MediaAsset) => {
    if (!fits(part, asset.mime)) {
      setWrong((now) => ({
        ...now,
        [part]: t(`wrongFormat.${FORMAT[part]}`),
      }));
      return;
    }
    setWrong((now) => ({ ...now, [part]: undefined }));
    setPart(part, asset.url);
  };
  const openLibrary = (part: Part | "auto") => {
    setPickerUsed(true);
    setPicking(part);
  };

  const slot = (part: Part) => {
    if (!parts.has(part)) return null;
    const pattern = childPattern(meta.pattern, part);
    const field = editor.blueprint.fields[pattern];
    const problem = editor.errors.get(dottedOf([...path, part]));
    return (
      <VideoFileSlot
        key={part}
        id={fieldId([...path, part])}
        label={field?.label ?? part}
        help={part === "mp4" ? t("mp4Help") : part === "webm" ? t("webmHelp") : undefined}
        format={FORMAT[part]}
        value={video?.[part]}
        required={required.has(part)}
        error={problem ? t("needed") : undefined}
        upload={latestFor(part)}
        wrong={wrong[part]}
        onFiles={(files) => send(part, files)}
        onLibrary={() => openLibrary(part)}
        onChange={(next) => setPart(part, next)}
        onRetry={uploads.retry}
        onDismiss={uploads.dismiss}
      />
    );
  };

  const remove =
    video && (optional || nullable) ? (
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

  const playable = video?.mp4 || video?.webm;
  const poster = video?.poster?.src?.trim();

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      {...(meta.help ? { help: meta.help } : {})}
      optional={optional}
      {...(meta.error ? { error: meta.error } : {})}
      group
      actions={remove}
    >
      <div className="flex min-w-0 flex-col gap-4 rounded-xl border border-mist-200 bg-white p-3 sm:p-4">
        {playable ? (
          <video
            key={`${video?.mp4 ?? ""}|${video?.webm ?? ""}`}
            controls
            muted
            playsInline
            preload="metadata"
            poster={poster || undefined}
            aria-label={t("preview")}
            className="aspect-video w-full max-w-2xl rounded-lg bg-midnight-950 object-contain"
          >
            {video?.webm ? <source src={video.webm} type="video/webm" /> : null}
            {video?.mp4 ? <source src={video.mp4} type="video/mp4" /> : null}
          </video>
        ) : (
          <MediaDropzone
            kind="video"
            onFiles={sendAny}
            onLink={(address) => {
              if (!isLinkableVideo(address)) {
                toast.error(t("linkHttps"));
                return;
              }
              setPart(/\.webm(?:[?#]|$)/i.test(address) ? "webm" : "mp4", address.trim());
            }}
            title={t("drop")}
            hint={t("types")}
            className="max-w-2xl"
          >
            {(browse) => (
              <>
                <Button type="button" size="sm" onClick={browse}>
                  <Upload aria-hidden="true" className="size-4" />
                  {t("uploadVideo")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => openLibrary("auto")}
                >
                  <Library aria-hidden="true" className="size-4" />
                  {t("library")}
                </Button>
              </>
            )}
          </MediaDropzone>
        )}

        <div className="flex min-w-0 flex-col gap-4">{MAIN.map(slot)}</div>

        {PHONE.some((part) => parts.has(part)) ? (
          <details className="rounded-lg border border-mist-200 px-3 py-1 open:pb-3">
            <summary className="min-h-11 cursor-pointer content-center text-[14px] font-semibold text-navy-900">
              {t("phone")}
            </summary>
            <p className="mb-3 text-[13.5px] text-mist-600">{t("phoneHint")}</p>
            <div className="flex flex-col gap-4">{PHONE.map(slot)}</div>
          </details>
        ) : null}

        {parts.has("poster") ? (
          <div className="flex min-w-0 flex-col gap-1.5">
            {posterBusy ? (
              <p
                aria-live="polite"
                className="flex items-center gap-2 text-[13.5px] text-brand-700"
              >
                <Clapperboard aria-hidden="true" className="size-4" />
                {t("posterMaking")}
              </p>
            ) : null}
            <SchemaField
              schema={posterNode}
              path={[...path, "poster"]}
              value={video?.poster}
              optional={!required.has("poster")}
            />
          </div>
        ) : null}

        {REST.filter((name) => parts.has(name)).map((name) => (
          <SchemaField
            key={name}
            schema={child(name)}
            path={[...path, name]}
            value={(video as Record<string, unknown> | null)?.[name]}
            optional={!required.has(name)}
          />
        ))}

        {CREDIT.some((name) => parts.has(name)) ? (
          <details className="rounded-lg border border-mist-200 px-3 py-1 open:pb-3">
            <summary className="min-h-11 cursor-pointer content-center text-[14px] font-semibold text-navy-900">
              {t("credit")}
            </summary>
            <div className="mt-2 flex flex-col gap-4">
              {CREDIT.filter((name) => parts.has(name)).map((name) => (
                <SchemaField
                  key={name}
                  schema={child(name)}
                  path={[...path, name]}
                  value={(video as Record<string, unknown> | null)?.[name]}
                  optional={!required.has(name)}
                />
              ))}
            </div>
          </details>
        ) : null}
      </div>

      {pickerUsed ? (
        <MediaPickerDialog
          open={picking !== null}
          onOpenChange={(next) => (next ? undefined : setPicking(null))}
          kind="video"
          mime={picking && picking !== "auto" ? `video/${FORMAT[picking]}` : undefined}
          current={MAIN.concat(PHONE)
            .map((part) => video?.[part] ?? "")
            .filter(Boolean)}
          title={title}
          onChoose={([asset]) => {
            if (!asset || !picking) return;
            choose(
              picking === "auto" ? (asset.mime === "video/webm" ? "webm" : "mp4") : picking,
              asset,
            );
          }}
        />
      ) : null}
    </FieldShell>
  );
}

export { VideoField };
