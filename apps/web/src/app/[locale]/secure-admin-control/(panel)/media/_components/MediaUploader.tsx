"use client";

import { useId, useRef, useState, useTransition } from "react";
import { ImageUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";

const MAX_BYTES = 12 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

type MediaUploaderProps = {
  strings: {
    title: string;
    hint: string;
    file: string;
    alt: string;
    altHint: string;
    upload: string;
    uploaded: string;
    tooLarge: string;
    wrongType: string;
    altRequired: string;
    failed: string;
  };
};

/**
 * Upload form for the media library (issue 109): one photo at a time with its alt text (required, PRD
 * accessibility). The server re-encodes it; the new photo appears at the top of the grid.
 */
function MediaUploader({ strings }: MediaUploaderProps) {
  const id = useId();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(next: File | null) {
    setError(null);
    if (next && next.size > MAX_BYTES) {
      setError(strings.tooLarge);
      setFile(null);
      return;
    }
    if (next && !ACCEPT.split(",").includes(next.type)) {
      setError(strings.wrongType);
      setFile(null);
      return;
    }
    setFile(next);
  }

  function upload() {
    if (!file) return;
    if (alt.trim().length < 3) {
      setError(strings.altRequired);
      return;
    }
    startTransition(async () => {
      const query = new URLSearchParams({ alt: alt.trim(), name: file.name.slice(0, 160) });
      const response = await fetch(`/secure-admin-control/media/upload?${query.toString()}`, {
        method: "POST",
        headers: { "content-type": file.type },
        body: file,
      }).catch(() => null);
      if (!response?.ok) {
        const body = (await response?.json().catch(() => null)) as { detail?: string } | null;
        setError(body?.detail ?? strings.failed);
        return;
      }
      setError(null);
      setFile(null);
      setAlt("");
      if (fileRef.current) fileRef.current.value = "";
      toast.success(strings.uploaded);
      router.refresh();
    });
  }

  return (
    <form
      aria-labelledby={`${id}-title`}
      className="flex min-w-0 flex-col gap-4 rounded-2xl border border-dashed border-mist-300 bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault();
        upload();
      }}
    >
      <div>
        <h2 id={`${id}-title`} className="font-display text-lg font-bold text-navy-900">
          {strings.title}
        </h2>
        <p className="mt-0.5 text-sm text-mist-600">{strings.hint}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor={`${id}-file`}>{strings.file}</Label>
          <Input
            ref={fileRef}
            id={`${id}-file`}
            type="file"
            accept={ACCEPT}
            className="cursor-pointer"
            onChange={(event) => choose(event.target.files?.[0] ?? null)}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor={`${id}-alt`}>{strings.alt}</Label>
          <Input
            id={`${id}-alt`}
            value={alt}
            maxLength={200}
            aria-describedby={`${id}-alt-hint`}
            onChange={(event) => setAlt(event.target.value)}
          />
          <p id={`${id}-alt-hint`} className="text-sm text-mist-600">
            {strings.altHint}
          </p>
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-fit" loading={pending} disabled={pending || !file}>
        <ImageUp aria-hidden="true" />
        {strings.upload}
      </Button>
    </form>
  );
}

export { MediaUploader };
