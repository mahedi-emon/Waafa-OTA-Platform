"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatBytes } from "@waafa/shared/helpers/media";
import { MediaThumb } from "@/components/admin/media/MediaThumb";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LibraryItem } from "./MediaDetailsSheet";

// The details sheet loads with the first file opened (D202).
const MediaDetailsSheet = dynamic(
  () => import("./MediaDetailsSheet").then((module) => module.MediaDetailsSheet),
  { ssr: false },
);

type MediaBrowserProps = {
  items: LibraryItem[];
  view: "grid" | "list";
  canDelete: boolean;
  keyNames: Record<string, string>;
};

const GRID_SIZES =
  "(min-width: 1536px) 240px, (min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw";

/** The library as tiles (4:3, the description under each) or as a list with sizes, uses and dates. */
function MediaBrowser({ items, view, canDelete, keyNames }: MediaBrowserProps) {
  const t = useTranslations("Admin.mediaLibrary");
  const [shownId, setShownId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const shown = items.find((item) => item.id === shownId) ?? null;
  const show = (id: string) => {
    setShownId(id);
    setIsOpen(true);
  };
  const sizeOf = (item: LibraryItem) =>
    item.kind === "photo" ? `${item.width} × ${item.height}` : formatBytes(item.bytes);

  return (
    <>
      {view === "grid" ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {items.map((item) => (
            <li key={item.id} className="min-w-0">
              <button
                type="button"
                onClick={() => show(item.id)}
                className="group flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-mist-200 bg-white text-left transition-colors outline-none hover:border-mist-400 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="relative block aspect-[4/3] w-full overflow-hidden bg-mist-100">
                  <MediaThumb url={item.url} kind={item.kind} alt="" sizes={GRID_SIZES} />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5 px-3 py-2.5">
                  <span className="sr-only">{t("detailsFor")}</span>
                  <span
                    className={
                      item.alt
                        ? "line-clamp-2 text-[13.5px] font-medium text-navy-900"
                        : "text-[13.5px] font-medium text-warning-800"
                    }
                  >
                    {item.alt || t("noAlt")}
                  </span>
                  <span className="text-[12.5px] text-mist-600 tabular-nums">
                    {sizeOf(item)} · {t("uses", { count: item.uses })}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-mist-200 bg-white">
          <Table scrollLabel={t("title")}>
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.file")}</TableHead>
                <TableHead>{t("columns.size")}</TableHead>
                <TableHead>{t("columns.uses")}</TableHead>
                <TableHead>{t("columns.uploaded")}</TableHead>
                <TableHead>
                  <span className="sr-only">{t("columns.actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <span className="flex min-w-56 items-center gap-3">
                      <span className="relative block size-14 shrink-0 overflow-hidden rounded-lg">
                        <MediaThumb url={item.url} kind={item.kind} alt="" sizes="56px" />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span
                          className={
                            item.alt
                              ? "line-clamp-2 text-[14px] font-medium text-navy-900"
                              : "text-[14px] font-medium text-warning-800"
                          }
                        >
                          {item.alt || t("noAlt")}
                        </span>
                        <span className="truncate text-[12.5px] text-mist-600">
                          {item.kind === "photo" ? t("photo") : t("video")}
                          {item.originalName ? ` · ${item.originalName}` : ""}
                        </span>
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {sizeOf(item)}
                    {item.kind === "photo" ? (
                      <span className="block text-[12.5px] text-mist-600">
                        {formatBytes(item.bytes)}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {t("uses", { count: item.uses })}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {item.createdLabel}
                    {item.uploadedBy ? (
                      <span className="block text-[12.5px] text-mist-600">{item.uploadedBy}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => show(item.id)}
                    >
                      {t("detailsButton")}
                      <span className="sr-only">: {item.alt || item.originalName || item.id}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {shown ? (
        <MediaDetailsSheet
          item={shown}
          open={isOpen}
          onOpenChange={setIsOpen}
          canDelete={canDelete}
          keyNames={keyNames}
        />
      ) : null}
    </>
  );
}

export { MediaBrowser };
