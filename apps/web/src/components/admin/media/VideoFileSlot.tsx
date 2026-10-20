"use client";

import { useId, useRef, useState } from "react";
import { FileVideo, Library, Link2, RotateCcw, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { isLinkableVideo } from "@/lib/admin/mediaAddress";
import type { UploadItem } from "./useUploadQueue";
import { useProblemText } from "./useProblemText";

export type VideoFormat = "mp4" | "webm";

type VideoFileSlotProps = {
  /** The field's id: error links land on the first button. */
  id: string;
  label: string;
  help?: string | undefined;
  format: VideoFormat;
  value: string | undefined;
  required: boolean;
  error?: string | undefined;
  /** This slot's upload on its way, or the one that failed. */
  upload?: UploadItem | undefined;
  /** Why the last file can't go here ("Choose an MP4 file here."). */
  wrong?: string | undefined;
  onFiles: (files: File[]) => void;
  onLibrary: () => void;
  onChange: (next: string | undefined) => void;
  onRetry: (key: string) => void;
  onDismiss: (key: string) => void;
};

/** "/uploads/2026/10/abc12345.mp4" → "abc12345.mp4", the part staff recognise. */
const fileName = (address: string) => address.split(/[?#]/)[0]?.split("/").pop() || address;

/**
 * One file of a video (the MP4, its WebM version, the phone versions): upload, choose from the library or paste a
 * link, with progress and Retry. The format is fixed per slot, so the right file lands in the right place.
 */
function VideoFileSlot({
  id,
  label,
  help,
  format,
  value,
  required,
  error,
  upload,
  wrong,
  onFiles,
  onLibrary,
  onChange,
  onRetry,
  onDismiss,
}: VideoFileSlotProps) {
  const t = useTranslations("Admin.media.video");
  const tw = useTranslations("Admin.editor.widgets");
  const problemText = useProblemText();
  const labelId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [linking, setLinking] = useState(false);
  // The address box keeps what staff type; an address the site can't play is never stored.
  const [address, setAddress] = useState(value ?? "");
  const [addressOf, setAddressOf] = useState(value);
  if (value !== addressOf) {
    setAddressOf(value);
    setAddress(value ?? "");
  }
  const addressProblem = address.trim() && !isLinkableVideo(address) ? t("linkHttps") : undefined;
  const busy = upload?.status === "waiting" || upload?.status === "uploading";
  const failed = upload?.status === "failed" ? upload : undefined;
  const problem = wrong ?? (failed ? problemText(failed.problem, "video") : undefined);

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span id={labelId} className="text-[14px] leading-tight font-semibold text-navy-900">
        {label}
        {required ? null : (
          <span className="ml-1.5 text-[12.5px] font-normal text-mist-500">{tw("optional")}</span>
        )}
      </span>
      {help ? <p className="-mt-0.5 text-[13.5px] leading-snug text-mist-600">{help}</p> : null}
      <div
        role="group"
        aria-labelledby={labelId}
        className="flex min-w-0 flex-col gap-2 rounded-lg border border-mist-200 bg-mist-50 p-2.5"
      >
        <span className="flex min-h-6 min-w-0 items-center gap-2 px-1 text-[13.5px]">
          <FileVideo aria-hidden="true" className="size-4 shrink-0 text-mist-500" />
          {busy && upload ? (
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className="truncate text-navy-900">{upload.file.name}</span>
              <Progress
                value={Math.round(upload.progress * 100)}
                aria-label={t("progress", { name: upload.file.name })}
                className="w-24 shrink-0"
              />
              <span className="shrink-0 text-mist-600 tabular-nums">
                {Math.round(upload.progress * 100)}%
              </span>
            </span>
          ) : value ? (
            <span className="truncate font-medium text-navy-900" title={value}>
              {fileName(value)}
            </span>
          ) : (
            <span className="text-mist-600">{t("none")}</span>
          )}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {busy && upload ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => onDismiss(upload.key)}>
              <X aria-hidden="true" className="size-4" />
              {t("cancel")}
            </Button>
          ) : (
            <>
              <Button
                id={id}
                type="button"
                variant="secondary"
                size="sm"
                aria-describedby={error ? `${id}-error` : undefined}
                onClick={() => fileInput.current?.click()}
              >
                <Upload aria-hidden="true" className="size-4" />
                {value ? t("replace") : t("upload")}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onLibrary}>
                <Library aria-hidden="true" className="size-4" />
                {t("library")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-expanded={linking}
                onClick={() => setLinking((now) => !now)}
              >
                <Link2 aria-hidden="true" className="size-4" />
                {t("link")}
              </Button>
              {value && !required ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("removeFile", { label })}
                  onClick={() => onChange(undefined)}
                >
                  <X aria-hidden="true" className="size-4" />
                </Button>
              ) : null}
            </>
          )}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept={`video/${format}`}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            if (files.length) onFiles(files.slice(0, 1));
          }}
        />
      </div>
      {linking ? (
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-link`} className="text-[13px] font-medium text-navy-900">
            {t(`address.${format}`)}
          </label>
          <Input
            id={`${id}-link`}
            value={address}
            aria-invalid={addressProblem ? true : undefined}
            aria-describedby={addressProblem ? `${id}-link-error` : undefined}
            spellCheck={false}
            inputMode="url"
            placeholder={`https://… .${format}`}
            onChange={(event) => {
              const next = event.target.value;
              setAddress(next);
              if (!next.trim()) onChange(undefined);
              else if (isLinkableVideo(next)) onChange(next.trim());
            }}
            className="h-11"
          />
          {addressProblem ? (
            <p
              id={`${id}-link-error`}
              role="alert"
              className="text-[13px] font-medium text-danger-700"
            >
              {addressProblem}
            </p>
          ) : null}
        </div>
      ) : null}
      {problem ? (
        <div className="flex flex-wrap items-center gap-2">
          <p role="alert" className="text-[13px] font-medium text-danger-700">
            {problem}
          </p>
          {failed && !wrong ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => onRetry(failed.key)}>
              <RotateCcw aria-hidden="true" className="size-4" />
              {t("retry")}
            </Button>
          ) : null}
        </div>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[13px] font-medium text-danger-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { VideoFileSlot };
