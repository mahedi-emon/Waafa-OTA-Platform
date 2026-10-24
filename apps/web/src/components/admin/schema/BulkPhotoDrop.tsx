"use client";

import { ImagePlus, RotateCcw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { MediaDropzone } from "@/components/admin/media/MediaDropzone";
import { photoFromAsset, type StoredPhoto } from "@/components/admin/media/photoFromAsset";
import { altFromName } from "@/components/admin/media/uploadMedia";
import { useProblemText } from "@/components/admin/media/useProblemText";
import { useUploadQueue } from "@/components/admin/media/useUploadQueue";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { suggestAlt } from "@/lib/admin/photoFrame";

const PHOTO_PARTS = new Set(["src", "alt", "width", "height", "credit", "creditUrl"]);

type BulkPhotoDropProps = {
  id: string;
  /** The record's title, for the photos' first description. */
  title: string | undefined;
  /** One uploaded photo, ready to become a list item. */
  onPhoto: (photo: StoredPhoto) => void;
};

/**
 * Several photos at once for a list of photo items (a gallery album, D0 R8): drop, choose or paste them; each one
 * uploads with progress and becomes its own item, ready for a caption. A failed one says why and offers Retry.
 */
function BulkPhotoDrop({ id, title, onPhoto }: BulkPhotoDropProps) {
  const t = useTranslations("Admin.media.gallery");
  const tBulk = useTranslations("Admin.editor.widgets.bulkPhotos");
  const problemText = useProblemText();
  const uploads = useUploadQueue({
    altFor: (file) => suggestAlt(title, altFromName(file.name)),
    onUploaded: (asset) => onPhoto(photoFromAsset(asset, PHOTO_PARTS)),
  });
  const pending = uploads.items.filter((item) => item.status !== "done");

  return (
    <div className="flex flex-col gap-3">
      {pending.length > 0 ? (
        <ul aria-label={t("uploads")} className="flex flex-col gap-2">
          {pending.map((item) => (
            <li
              key={item.key}
              className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-mist-200 bg-white p-2.5"
            >
              <span className="min-w-0 flex-1 truncate text-[13.5px] text-navy-900">
                {item.file.name}
              </span>
              {item.status === "failed" ? (
                <>
                  <span role="alert" className="w-full text-[12.5px] font-medium text-danger-700">
                    {problemText(item.problem, "photo")}
                  </span>
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
                </>
              ) : (
                <>
                  <Progress
                    value={Math.round(item.progress * 100)}
                    aria-label={t("progress", { name: item.file.name })}
                    className="w-32"
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
                </>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      <MediaDropzone
        id={id}
        kind="photo"
        multiple
        compact
        onFiles={(files) => {
          uploads.clearDone();
          uploads.add(files);
        }}
        title={tBulk("drop")}
        hint={t("types")}
      >
        {(browse) => (
          <Button type="button" size="sm" onClick={browse}>
            <ImagePlus aria-hidden="true" className="size-4" />
            {tBulk("upload")}
          </Button>
        )}
      </MediaDropzone>
    </div>
  );
}

export { BulkPhotoDrop };
