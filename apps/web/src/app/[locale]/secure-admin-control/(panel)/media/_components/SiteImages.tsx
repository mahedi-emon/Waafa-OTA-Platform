import { ImageIcon } from "lucide-react";
import { Film } from "@/components/icons/server/Film";
import { Pencil } from "@/components/icons/server/Pencil";
import { getTranslations } from "next-intl/server";
import type { MediaSlot } from "@waafa/shared";
import { AdminEmpty } from "@/components/admin/AdminEmpty";
import { MediaThumb } from "@/components/admin/media/MediaThumb";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import type { ContentCollection } from "@/lib/admin/types";

type SiteImagesProps = {
  slots: ContentCollection["items"];
};

/**
 * Site images (replaces Media slots, ADMIN.md §5.7): one card per fixed place on the site (page headers, the home
 * hero, the office photo) with what shows there now; Change opens its editor.
 */
async function SiteImages({ slots }: SiteImagesProps) {
  const [t, tc] = await Promise.all([
    getTranslations("Admin.mediaLibrary.site"),
    getTranslations("Admin.choices.mediaSlot"),
  ]);
  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-mist-200 bg-white">
        <AdminEmpty icons={[ImageIcon]} title={t("emptyTitle")} body={t("emptyBody")} />
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {slots.map((slot) => {
        const data = (slot.data ?? {}) as Partial<MediaSlot>;
        const place = data.key && tc.has(data.key) ? tc(data.key) : slot.title;
        const image = data.image ?? data.video?.poster;
        const isVideo = Boolean(data.video?.mp4);
        return (
          <li key={slot.id} className="min-w-0">
            <Link
              href={`/secure-admin-control/content/mediaSlots/${encodeURIComponent(slot.id)}`}
              prefetch={false}
              className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-mist-200 bg-white outline-none hover:border-mist-400 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="relative block aspect-video w-full overflow-hidden bg-mist-100">
                {image?.src ? (
                  <MediaThumb
                    url={image.src}
                    kind="photo"
                    alt=""
                    sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
                    focal={image.focal}
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-mist-500">
                    <ImageIcon aria-hidden="true" className="size-7" />
                  </span>
                )}
                {isVideo ? (
                  <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-midnight-950/80 px-2 py-0.5 text-[12px] font-semibold text-white">
                    <Film aria-hidden="true" className="size-3.5" />
                    {t("video")}
                  </span>
                ) : null}
              </span>
              <span className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3 py-3">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[14.5px] font-semibold text-navy-900">{place}</span>
                  <span className="text-[12.5px] text-mist-600">
                    {isVideo ? t("videoWithPoster") : image?.src ? t("photo") : t("nothing")}
                  </span>
                </span>
                <span className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2 text-[14px] font-semibold text-brand-700 group-hover:bg-electric-50">
                  <Pencil aria-hidden="true" className="size-4" />
                  {t("change")}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export { SiteImages };
