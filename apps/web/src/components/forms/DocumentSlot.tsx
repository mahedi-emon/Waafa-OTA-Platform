"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, FileText, LoaderCircle, Upload, X } from "lucide-react";
import type { PrivateFile } from "@waafa/shared";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  VISA_FILE_ACCEPT,
  checkVisaFile,
  formatFileSize,
  type VisaFileType,
} from "@/lib/visa/visaFiles";

const IMAGE_ACCEPT = ".jpg,.jpeg,.png,image/jpeg,image/png";

export type SlotFile = {
  fileName: string;
  mimeType: VisaFileType;
  sizeBytes: number;
  /** The claim from POST /api/uploads; the form sends it back so the record gets the file (issue 232). */
  storageKey?: string;
};

type SlotError = "fileType" | "fileSize" | "fileEmpty" | "upload";

type DocumentSlotProps = {
  title: string;
  sub: string;
  /** What the file is, so staff see it labelled (PrivateFileSchema kind). */
  kind: PrivateFile["kind"];
  file: SlotFile | null;
  onChange: (file: SlotFile | null) => void;
  /** Photos only (JPG or PNG), e.g. a feedback photo; PDFs are rejected. */
  imagesOnly?: boolean;
  labels: {
    choose: string;
    rule: string;
    replace: string;
    /** "{file}" is replaced with the file name. */
    remove: string;
    added: string;
    uploading: string;
    errors: Record<SlotError, string>;
  };
};

/**
 * One document slot (VisaApply-2): choose a file or take a photo; JPG, PNG or PDF up to 5 MB. The file uploads to the
 * site's private storage as soon as it is picked (issue 232); the slot counts as filled only once it has arrived, so
 * a form never claims a file it does not have.
 */
function DocumentSlot({
  title,
  sub,
  kind,
  file,
  onChange,
  imagesOnly = false,
  labels,
}: DocumentSlotProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const [error, setError] = useState<SlotError | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => () => request.current?.abort(), []);

  async function pick(list: FileList | null) {
    const chosen = list?.[0];
    if (!chosen) return;
    const check = checkVisaFile(chosen);
    if (check.ok && imagesOnly && check.mimeType === "application/pdf") {
      setError("fileType");
      return;
    }
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setError(null);
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const fileName = chosen.name.slice(0, 120);
    setUploading(fileName);
    try {
      const query = new URLSearchParams({ kind, name: fileName });
      const response = await fetch(`/api/uploads?${query.toString()}`, {
        method: "POST",
        headers: { "content-type": check.mimeType },
        body: chosen,
        signal: controller.signal,
      });
      if (!response.ok) {
        setError(
          response.status === 415 ? "fileType" : response.status === 413 ? "fileSize" : "upload",
        );
        return;
      }
      const stored = (await response.json()) as { storageKey: string };
      onChange({
        fileName,
        mimeType: check.mimeType,
        sizeBytes: chosen.size,
        storageKey: stored.storageKey,
      });
    } catch (failure) {
      if (!(failure instanceof DOMException && failure.name === "AbortError")) setError("upload");
    } finally {
      if (request.current === controller) {
        request.current = null;
        setUploading(null);
      }
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-4",
        error
          ? "border-danger-600"
          : file
            ? "border-success-600/40 bg-success-50"
            : "border-mist-200 bg-white",
      )}
      aria-busy={uploading ? true : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p id={`${id}-title`} className="text-[15px] font-semibold text-navy-900">
            {title}
          </p>
          <p className="text-[13px] text-mist-600">{sub}</p>
        </div>
        {file && !uploading ? (
          <span className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-success-600">
            <CheckCircle2 aria-hidden="true" className="size-4" />
            {labels.added}
          </span>
        ) : null}
      </div>
      {uploading ? (
        <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2" role="status">
          <LoaderCircle
            aria-hidden="true"
            className="size-5 shrink-0 text-electric-600 motion-safe:animate-spin"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-medium text-ink-900">{uploading}</span>
            <span className="block text-[12.5px] text-mist-600">{labels.uploading}</span>
          </span>
        </div>
      ) : file ? (
        <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2">
          <FileText aria-hidden="true" className="size-5 shrink-0 text-brand-700" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-medium text-ink-900">
              {file.fileName}
            </span>
            <span className="block text-[12.5px] text-mist-600 tabular-nums">
              {formatFileSize(file.sizeBytes)}
            </span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={labels.remove.replace("{file}", file.fileName)}
            onClick={() => {
              onChange(null);
              if (input.current) input.current.value = "";
            }}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      ) : null}
      <input
        ref={input}
        id={`${id}-input`}
        type="file"
        accept={imagesOnly ? IMAGE_ACCEPT : VISA_FILE_ACCEPT}
        aria-labelledby={`${id}-title`}
        aria-describedby={error ? `${id}-error` : `${id}-rule`}
        aria-invalid={error ? true : undefined}
        disabled={uploading !== null}
        onChange={(event) => void pick(event.target.files)}
        className="sr-only"
      />
      <label
        htmlFor={`${id}-input`}
        aria-disabled={uploading !== null ? true : undefined}
        className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-mist-300 bg-white px-3 text-[14px] font-semibold text-brand-700 hover:border-electric-600 aria-disabled:cursor-progress aria-disabled:opacity-60 [input:focus-visible+&]:ring-3 [input:focus-visible+&]:ring-ring/40"
      >
        <Upload aria-hidden="true" className="size-4" />
        {file ? labels.replace : labels.choose}
      </label>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[13px] font-medium text-danger-600">
          {labels.errors[error]}
        </p>
      ) : (
        <p id={`${id}-rule`} className="text-[12.5px] text-mist-600">
          {labels.rule}
        </p>
      )}
    </div>
  );
}

export { DocumentSlot };
