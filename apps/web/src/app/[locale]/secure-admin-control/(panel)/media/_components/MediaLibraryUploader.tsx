"use client";

import { useRef } from "react";
import { ImagePlus, RotateCcw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { mediaKindOf } from "@waafa/shared/helpers/media";
import { MediaDropzone } from "@/components/admin/media/MediaDropzone";
import { altFromName } from "@/components/admin/media/uploadMedia";
import { useProblemText } from "@/components/admin/media/useProblemText";
import { useUploadQueue } from "@/components/admin/media/useUploadQueue";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "@/i18n/navigation";

/**
 * Upload many photos and videos at once (drop anywhere on the zone, choose, or paste), two at a time with progress
 * and Retry; the library below refreshes when a batch is in. New files are described from their names until staff
 * improve the words in their details.
 */
function MediaLibraryUploader() {
  const t = useTranslations("Admin.mediaLibrary.upload");
  const problemText = useProblemText();
  const router = useRouter();
  const added = useRef(0);
  const refresh = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uploads = useUploadQueue({
    altFor: (file) => {
      const words = altFromName(file.name);
      if (words.length >= 3) return words;
      return file.type.startsWith("video/") ? "Video" : "Photo";
    },
    onUploaded: () => {
      added.current += 1;
      // One refresh per batch, shortly after the last file of it lands.
      if (refresh.current) clearTimeout(refresh.current);
      refresh.current = setTimeout(() => {
        toast.success(t("done", { count: added.current }));
        added.current = 0;
        uploads.clearDone();
        router.refresh();
      }, 600);
    },
  });
  const shown = uploads.items.filter((item) => item.status !== "done");

  return (
    <section aria-label={t("label")} className="flex flex-col gap-3">
      <MediaDropzone
        kind="any"
        multiple
        compact
        onFiles={uploads.add}
        title={t("drop")}
        hint={t("hint")}
      >
        {(browse) => (
          <Button type="button" size="sm" onClick={browse}>
            <ImagePlus aria-hidden="true" className="size-4" />
            {t("choose")}
          </Button>
        )}
      </MediaDropzone>
      {shown.length > 0 ? (
        <ul aria-label={t("uploads")} className="flex flex-col gap-2">
          {shown.map((item) => {
            const kind = mediaKindOf(item.file.type);
            return (
              <li
                key={item.key}
                className="flex min-w-0 flex-col gap-2 rounded-xl border border-mist-200 bg-white px-3 py-2.5 sm:flex-row sm:items-center"
              >
                <span className="min-w-0 flex-1 truncate text-[14px] text-navy-900">
                  {item.file.name}
                </span>
                {item.status === "failed" ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <span role="alert" className="text-[13px] font-medium text-danger-700">
                      {problemText(item.problem, kind)}
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
                  </span>
                ) : (
                  <span className="flex items-center gap-2 sm:w-64">
                    <Progress
                      value={Math.round(item.progress * 100)}
                      aria-label={t("progress", { name: item.file.name })}
                      className="flex-1"
                    />
                    <span className="w-10 text-right text-[13px] text-mist-600 tabular-nums">
                      {Math.round(item.progress * 100)}%
                    </span>
                  </span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={
                    item.status === "failed"
                      ? t("dismiss", { name: item.file.name })
                      : t("cancel", { name: item.file.name })
                  }
                  onClick={() => uploads.dismiss(item.key)}
                  className="self-end sm:self-auto"
                >
                  <X aria-hidden="true" className="size-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

export { MediaLibraryUploader };
