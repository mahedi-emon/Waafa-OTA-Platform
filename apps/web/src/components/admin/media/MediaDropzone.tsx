"use client";

import type { ClipboardEvent, CSSProperties, ReactNode } from "react";
import { useDropzone, type Accept } from "react-dropzone";
import { CloudUpload } from "lucide-react";
import { PHOTO_TYPES, VIDEO_TYPES, type MediaKind } from "@waafa/shared/helpers/media";
import { cn } from "cn";

type MediaDropzoneProps = {
  /** The zone takes the field's id when it is the field (no photo yet), so error links reach it. */
  id?: string;
  /** "any": photos and videos together (the library page). */
  kind: MediaKind | "any";
  multiple?: boolean;
  disabled?: boolean;
  /** Every dropped, chosen or pasted file, the wrong ones too: the upload explains why one can't be used. */
  onFiles: (files: File[]) => void;
  /** A pasted web address instead of a file. */
  onLink?: (address: string) => void;
  /** "Drop a photo here or paste one". */
  title: string;
  /** The id of the field's error, when it has one. */
  describedBy?: string;
  /** The frame and the file rules, under the title. */
  hint: string;
  /** The zone draws its children (the current photo) and shows the title only while a file is dragged over it. */
  covered?: boolean;
  /** One row when the zone is wide (a gallery with photos, the library page): icon, words, then the buttons. */
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
  /** The buttons inside (Upload, Choose from library); `browse` opens the file chooser. */
  children: (browse: () => void) => ReactNode;
};

const accepts = (types: readonly string[]): Accept =>
  Object.fromEntries(types.map((type) => [type, []]));
const ACCEPT: Record<MediaKind | "any", Accept> = {
  photo: accepts(PHOTO_TYPES),
  video: accepts(VIDEO_TYPES),
  any: accepts([...PHOTO_TYPES, ...VIDEO_TYPES]),
};

/**
 * Where files arrive (ADMIN.md §11, the uvain/file-upload pattern built on react-dropzone, D207): drag and drop,
 * the file chooser from the buttons inside, or paste from the clipboard while it has focus. Nothing uploads here:
 * the files go to `onFiles`, which checks and uploads them with progress.
 */
function MediaDropzone({
  id,
  kind,
  multiple = false,
  disabled = false,
  onFiles,
  onLink,
  title,
  describedBy,
  hint,
  covered = false,
  compact = false,
  className,
  style,
  children,
}: MediaDropzoneProps) {
  const { getRootProps, getInputProps, open, isDragActive, isDragReject } = useDropzone({
    accept: ACCEPT[kind],
    multiple,
    disabled,
    noClick: true,
    noKeyboard: true,
    onDrop: (accepted, rejected) => {
      const files = [...accepted, ...rejected.map((rejection) => rejection.file)];
      if (files.length) onFiles(multiple ? files : files.slice(0, 1));
    },
  });

  const paste = (event: ClipboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const target = event.target as HTMLElement;
    // Words pasted into a text box inside stay there.
    if (target.closest("input, textarea, [contenteditable=true]")) return;
    const files = Array.from(event.clipboardData.files);
    if (files.length) {
      event.preventDefault();
      onFiles(multiple ? files : files.slice(0, 1));
      return;
    }
    const text = event.clipboardData.getData("text/plain").trim();
    if (onLink && /^(https?:\/\/|\/)\S+$/.test(text)) {
      event.preventDefault();
      onLink(text);
    }
  };

  const state = isDragReject ? "reject" : isDragActive ? "over" : "idle";
  const root = getRootProps({
    onPaste: paste,
    className: cn(
      "relative min-w-0 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
      !covered &&
        "@container flex rounded-xl border-2 border-dashed px-4 transition-colors duration-150 motion-reduce:transition-none sm:px-6",
      !covered && (compact ? "py-4" : "py-6"),
      !covered &&
        (state === "reject"
          ? "border-danger-600 bg-danger-50"
          : state === "over"
            ? "border-electric-600 bg-electric-50"
            : "border-mist-300 bg-mist-50"),
      disabled && "opacity-60",
      className,
    ),
  });

  return (
    <div
      {...root}
      {...(id ? { id } : {})}
      role="group"
      aria-label={title}
      aria-describedby={describedBy}
      tabIndex={disabled ? -1 : 0}
      style={style}
    >
      {/* The buttons inside are the way in for keyboards and screen readers; this input only takes the files. */}
      <input {...getInputProps({ "aria-hidden": true, tabIndex: -1 })} />
      {covered ? (
        <>
          {children(open)}
          {state !== "idle" ? (
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center p-3 text-center text-[14px] font-semibold",
                state === "reject"
                  ? "bg-danger-50/95 text-danger-700"
                  : "bg-electric-50/95 text-brand-700",
              )}
            >
              {title}
            </span>
          ) : null}
        </>
      ) : (
        <div
          className={cn(
            "flex w-full flex-col items-center justify-center gap-3 text-center",
            compact && "@xl:flex-row @xl:justify-start @xl:text-left",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1",
              state === "reject"
                ? "text-danger-600 ring-danger-600/30"
                : "text-brand-700 ring-mist-200",
            )}
          >
            <CloudUpload className="size-5" />
          </span>
          <span className={cn("flex flex-col gap-1", compact && "@xl:min-w-0 @xl:flex-1")}>
            <span className="text-[15px] font-semibold text-navy-900">{title}</span>
            {hint ? <span className="text-[13px] leading-snug text-mist-600">{hint}</span> : null}
          </span>
          <span className="flex flex-wrap items-center justify-center gap-2">{children(open)}</span>
        </div>
      )}
    </div>
  );
}

export { MediaDropzone };
