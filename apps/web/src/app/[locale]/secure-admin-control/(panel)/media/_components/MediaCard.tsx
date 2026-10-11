"use client";

import { useId, useState, useTransition } from "react";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SmartImage } from "@/components/media/SmartImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { removeMedia, updateMediaAlt } from "@/lib/admin/mediaActions";

export type MediaItem = {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
  bytes: number;
  uploadedBy: string | null;
  createdLabel: string;
};

type MediaCardProps = {
  item: MediaItem;
  canDelete: boolean;
  strings: {
    alt: string;
    saveAlt: string;
    altSaved: string;
    copy: string;
    copied: string;
    remove: string;
    removeConfirm: string;
    removed: string;
    failed: string;
  };
};

const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** One library photo (issue 109): preview, alt text, the URL to paste into any image field, delete. */
function MediaCard({ item, canDelete, strings }: MediaCardProps) {
  const id = useId();
  const router = useRouter();
  const [alt, setAlt] = useState(item.alt);
  const [pending, startTransition] = useTransition();

  function saveAlt() {
    startTransition(async () => {
      const result = await updateMediaAlt(item.id, alt);
      if (!result.ok) toast.error(result.problem.detail ?? strings.failed);
      else {
        toast.success(strings.altSaved);
        router.refresh();
      }
    });
  }

  function remove() {
    if (!window.confirm(strings.removeConfirm)) return;
    startTransition(async () => {
      const result = await removeMedia(item.id);
      if (!result.ok) toast.error(result.problem.detail ?? strings.failed);
      else {
        toast.success(strings.removed);
        router.refresh();
      }
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(item.url);
      toast.success(strings.copied);
    } catch {
      toast.error(strings.failed);
    }
  }

  return (
    <li className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-mist-200 bg-white">
      <SmartImage
        src={item.url}
        alt={item.alt}
        ratio="4/3"
        sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 100vw"
      />
      <div className="flex min-w-0 flex-col gap-3 p-4">
        <p className="text-[13px] text-mist-600 tabular-nums">
          {item.width} × {item.height} · {kb(item.bytes)} · {item.createdLabel}
          {item.uploadedBy ? ` · ${item.uploadedBy}` : ""}
        </p>
        <form
          className="flex min-w-0 flex-col gap-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            saveAlt();
          }}
        >
          <Label htmlFor={`${id}-alt`}>{strings.alt}</Label>
          <div className="flex min-w-0 gap-2">
            <Input
              id={`${id}-alt`}
              value={alt}
              maxLength={200}
              className="min-w-0 flex-1"
              onChange={(event) => setAlt(event.target.value)}
            />
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={pending || alt.trim() === item.alt || alt.trim().length < 3}
            >
              {strings.saveAlt}
            </Button>
          </div>
        </form>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => void copy()}>
            <Copy aria-hidden="true" />
            {strings.copy}
          </Button>
          {canDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-danger-600"
              disabled={pending}
              onClick={remove}
            >
              <Trash2 aria-hidden="true" />
              {strings.remove}
            </Button>
          ) : null}
        </div>
        <code className="block truncate rounded-md bg-mist-50 px-2 py-1 text-[12.5px] text-mist-700">
          {item.url}
        </code>
      </div>
    </li>
  );
}

export { MediaCard };
