import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminEmpty } from "@/components/admin/AdminEmpty";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { adminGet, hasRole, requireStaff } from "@/lib/admin/adminApi";
import { formatDhakaDateTime, pageParam } from "@/lib/admin/format";
import { MediaCard, type MediaItem } from "./_components/MediaCard";
import { MediaUploader } from "./_components/MediaUploader";

type MediaList = {
  items: Array<Omit<MediaItem, "createdLabel"> & { createdAt: string }>;
  total: number;
  page: number;
  pageSize: number;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.mediaLibrary");
  return { title: t("metaTitle") };
}

async function MediaLibrary({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/media">["searchParams"];
}) {
  const params = await searchParams;
  const page = pageParam(params.page);
  const q = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const [staff, t, tc] = await Promise.all([
    requireStaff(),
    getTranslations("Admin.mediaLibrary"),
    getTranslations("Admin.common"),
  ]);
  const list = await adminGet<MediaList>("/admin/media", { page, ...(q ? { q } : {}) });
  const canDelete = hasRole(staff, "admin", "content-editor");

  return (
    <>
      <AdminPageHeader
        title={t("title")}
        lead={t("lead")}
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href="/secure-admin-control/content/mediaSlots">{t("slots")}</Link>
          </Button>
        }
      />
      <MediaUploader
        strings={{
          title: t("uploadTitle"),
          hint: t("uploadHint"),
          file: t("file"),
          alt: t("alt"),
          altHint: t("altHint"),
          upload: t("upload"),
          uploaded: t("uploaded"),
          tooLarge: t("tooLarge"),
          wrongType: t("wrongType"),
          altRequired: t("altRequired"),
          failed: tc("failed"),
        }}
      />
      <form role="search" className="flex max-w-md gap-2" action="/secure-admin-control/media">
        <label htmlFor="media-search" className="sr-only">
          {t("search")}
        </label>
        <Input
          id="media-search"
          type="search"
          name="q"
          defaultValue={q}
          placeholder={t("search")}
        />
        <Button type="submit" variant="secondary">
          {t("searchButton")}
        </Button>
      </form>
      <section aria-label={t("title")} className="flex flex-col gap-4">
        {list.items.length === 0 ? (
          <div className="rounded-2xl border border-mist-200 bg-white">
            <AdminEmpty title={t("emptyTitle")} body={t("emptyBody")} />
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {list.items.map((item) => (
              <MediaCard
                key={item.id}
                item={{ ...item, createdLabel: formatDhakaDateTime(item.createdAt) }}
                canDelete={canDelete}
                strings={{
                  alt: t("alt"),
                  saveAlt: t("saveAlt"),
                  altSaved: t("altSaved"),
                  copy: t("copy"),
                  copied: t("copied"),
                  remove: t("remove"),
                  removeConfirm: t("removeConfirm"),
                  removed: t("removed"),
                  failed: tc("failed"),
                }}
              />
            ))}
          </ul>
        )}
        <div className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
          <AdminPagination
            page={list.page}
            pageSize={list.pageSize}
            total={list.total}
            path="/secure-admin-control/media"
            query={q ? { q } : {}}
            strings={{
              previous: tc("previous"),
              next: tc("next"),
              summary: tc("showing", { shown: list.items.length, total: list.total }),
            }}
          />
        </div>
      </section>
    </>
  );
}

/**
 * Admin › Media library (issue 109): upload photos with alt text, copy their /uploads/ URL into any image field,
 * rename and delete.
 */
export default function MediaLibraryPage(props: PageProps<"/[locale]/secure-admin-control/media">) {
  return (
    <Suspense fallback={<Skeleton className="h-[480px] rounded-2xl" />}>
      <MediaLibrary searchParams={props.searchParams} />
    </Suspense>
  );
}
