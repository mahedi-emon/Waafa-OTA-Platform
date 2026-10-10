"use client";

import { useId, useRef, useState } from "react";
import { CheckCircle2, FileText, Upload, X } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  VISA_FILE_ACCEPT,
  checkVisaFile,
  formatFileSize,
  type VisaFileType,
} from "@/lib/visa/visaFiles";

export type SlotFile = { fileName: string; mimeType: VisaFileType; sizeBytes: number };

type DocumentSlotProps = {
  title: string;
  sub: string;
  file: SlotFile | null;
  onChange: (file: SlotFile | null) => void;
  labels: {
    choose: string;
    rule: string;
    replace: string;
    /** "{file}" is replaced with the file name. */
    remove: string;
    added: string;
    errors: { fileType: string; fileSize: string; fileEmpty: string };
  };
};

/**
 * One document slot (VisaApply-2): choose a file or take a photo; JPG, PNG or PDF up to 5 MB. The file stays in the
 * browser in Phase A; only its name, type and size are kept.
 */
function DocumentSlot({ title, sub, file, onChange, labels }: DocumentSlotProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<keyof DocumentSlotProps["labels"]["errors"] | null>(null);

  function pick(list: FileList | null) {
    const chosen = list?.[0];
    if (!chosen) return;
    const check = checkVisaFile(chosen);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setError(null);
    onChange({
      fileName: chosen.name.slice(0, 120),
      mimeType: check.mimeType,
      sizeBytes: chosen.size,
    });
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
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p id={`${id}-title`} className="text-[15px] font-semibold text-navy-900">
            {title}
          </p>
          <p className="text-[13px] text-mist-600">{sub}</p>
        </div>
        {file ? (
          <span className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-success-600">
            <CheckCircle2 aria-hidden="true" className="size-4" />
            {labels.added}
          </span>
        ) : null}
      </div>
      {file ? (
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
        accept={VISA_FILE_ACCEPT}
        aria-labelledby={`${id}-title`}
        aria-describedby={error ? `${id}-error` : `${id}-rule`}
        aria-invalid={error ? true : undefined}
        onChange={(event) => pick(event.target.files)}
        className="sr-only"
      />
      <label
        htmlFor={`${id}-input`}
        className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-mist-300 bg-white px-3 text-[14px] font-semibold text-brand-700 hover:border-electric-600 [input:focus-visible+&]:ring-3 [input:focus-visible+&]:ring-ring/40"
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
