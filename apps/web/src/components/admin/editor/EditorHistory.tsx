"use client";

import { useEffect, useState, useTransition } from "react";
import { History } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ContentHistory, ContentHistoryEntry } from "@waafa/shared";
import { RelativeTime } from "@/components/admin/RelativeTime";
import { useRouter } from "@/i18n/navigation";
import { changesBetween } from "@/lib/admin/blueprints/diff";
import { changeSentence, type HistoryWords } from "@/lib/admin/blueprints/historyText";
import type { ResolvedBlueprint } from "@/lib/admin/blueprints/types";
import { restoreVersion } from "@/lib/admin/contentActions";
import { formatDhakaDateTime } from "@/lib/admin/format";
import { markSignedOut } from "../sessionStore";
import { RestoreVersionButton } from "./RestoreVersionButton";

type EditorHistoryProps = {
  contentKey: string;
  /** The record's id; null for a setting. */
  recordId: string | null;
  blueprint: ResolvedBlueprint;
  version?: number;
  /** Unsaved work blocks a restore until it is saved or discarded. */
  dirty: boolean;
};

type Loaded = { status: "loading" | "ready" | "failed"; entries: ContentHistoryEntry[] };

const SHOWN = 4;

/**
 * Every saved change of the record, newest first, as plain sentences ("Price from: ৳64,900 → ৳59,900"), with who
 * and when, and "Restore this version" (ADMIN.md §9). Restoring is itself saved, so it can be undone the same way.
 */
function EditorHistory({ contentKey, recordId, blueprint, version, dirty }: EditorHistoryProps) {
  const t = useTranslations("Admin.editor.history");
  const router = useRouter();
  const [loaded, setLoaded] = useState<Loaded>({ status: "loading", entries: [] });
  const [pending, startTransition] = useTransition();
  const url =
    recordId === null
      ? `/secure-admin-control/api/settings/${contentKey}/history`
      : `/secure-admin-control/api/content/${contentKey}/${encodeURIComponent(recordId)}/history`;

  useEffect(() => {
    let live = true;
    fetch(url, { headers: { accept: "application/json" }, cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) markSignedOut();
        if (!response.ok) throw new Error(String(response.status));
        // The admin route checks the shape on the server, so zod stays out of the browser.
        const parsed = (await response.json()) as ContentHistory;
        if (live) setLoaded({ status: "ready", entries: parsed.entries });
      })
      .catch(() => {
        if (live) setLoaded({ status: "failed", entries: [] });
      });
    return () => {
      live = false;
    };
  }, [url, version]);

  const words: HistoryWords = {
    change: (field, from, to) => t("change", { field, from, to }),
    set: (field, to) => t("set", { field, to }),
    cleared: (field) => t("cleared", { field }),
    edited: (field) => t("edited", { field }),
    list: (field, from, to) => t("listChanged", { field, from, to }),
    on: t("on"),
    off: t("off"),
  };

  const restore = (entry: ContentHistoryEntry, side: "before" | "after") =>
    startTransition(async () => {
      const result = await restoreVersion(contentKey, recordId, entry.id, version, side);
      if (!result.ok) {
        if (result.problem.status === 401) markSignedOut();
        else toast.error(result.problem.status === 409 ? t("unsavedFirst") : t("failed"));
        return;
      }
      toast.success(t("restored"));
      if (recordId !== null && result.id && result.id !== recordId)
        router.replace(
          `/secure-admin-control/content/${contentKey}/${encodeURIComponent(result.id)}`,
        );
      else router.refresh();
    });

  if (loaded.status === "loading")
    return (
      <p className="rounded-2xl border border-mist-200 bg-white p-6 text-[14px] text-mist-600">
        {t("loading")}
      </p>
    );
  if (loaded.status === "failed")
    return (
      <p
        role="alert"
        className="rounded-2xl border border-danger-700/20 bg-danger-50 p-6 text-[14px] text-danger-700"
      >
        {t("failed")}
      </p>
    );

  return (
    <section
      aria-labelledby="history-title"
      className="rounded-2xl border border-mist-200 bg-white p-4 sm:p-6"
    >
      <header className="mb-5">
        <h2 id="history-title" className="font-display text-[18px] font-bold text-navy-900">
          {t("title")}
        </h2>
        <p className="mt-1 text-[14px] text-mist-600">{t("lead")}</p>
      </header>
      {loaded.entries.length === 0 ? (
        <p className="flex items-center gap-2 text-[14px] text-mist-600">
          <History aria-hidden="true" className="size-4" />
          {t("empty")}
        </p>
      ) : (
        <ol className="flex flex-col gap-4 border-l-2 border-mist-200 pl-4">
          {loaded.entries.map((entry, index) => {
            const created =
              entry.action === "content.create" || entry.action === "content.duplicate";
            const changes = created ? [] : changesBetween(entry.before, entry.after, blueprint);
            const sentences = changes
              .slice(0, SHOWN)
              .map((change) => changeSentence(blueprint, change, words));
            const action = t.has(`actions.${entry.action}` as "actions.content.update")
              ? t(`actions.${entry.action}` as "actions.content.update")
              : entry.action;
            return (
              <li key={entry.id} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 -left-[23px] size-3 rounded-full bg-electric-600 ring-4 ring-white"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[13.5px] text-mist-600">
                    <span className="font-semibold text-navy-900">{action}</span> ·{" "}
                    {entry.actorName} · <RelativeTime iso={entry.at} />
                  </p>
                  {index === 0 ? (
                    <span className="rounded-full bg-success-50 px-2.5 py-0.5 text-[12px] font-semibold text-success-700">
                      {t("current")}
                    </span>
                  ) : entry.after !== undefined ? (
                    <RestoreVersionButton
                      label={t("restore")}
                      title={t("restoreTitle", { time: formatDhakaDateTime(entry.at) })}
                      disabled={pending || dirty}
                      {...(dirty ? { reason: t("unsavedFirst") } : {})}
                      onConfirm={() => restore(entry, "after")}
                    />
                  ) : null}
                  {/* The oldest change can also be undone: the version it replaced (seeded records have no
                      earlier entry). */}
                  {index === loaded.entries.length - 1 && !created && entry.before !== undefined ? (
                    <RestoreVersionButton
                      label={t("restoreBefore")}
                      title={t("restoreBeforeTitle", { time: formatDhakaDateTime(entry.at) })}
                      disabled={pending || dirty}
                      {...(dirty ? { reason: t("unsavedFirst") } : {})}
                      onConfirm={() => restore(entry, "before")}
                    />
                  ) : null}
                </div>
                {sentences.length > 0 ? (
                  <ul className="mt-1.5 flex flex-col gap-0.5 text-[14px] text-ink-900">
                    {sentences.map((sentence, position) => (
                      <li key={position}>{sentence}</li>
                    ))}
                    {changes.length > SHOWN ? (
                      <li className="text-mist-600">
                        {t("more", { count: changes.length - SHOWN })}
                      </li>
                    ) : null}
                  </ul>
                ) : !created ? (
                  <p className="mt-1 text-[13.5px] text-mist-600">{t("noChanges")}</p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
      {dirty ? <p className="mt-4 text-[13.5px] text-warning-800">{t("unsavedFirst")}</p> : null}
    </section>
  );
}

export { EditorHistory };
