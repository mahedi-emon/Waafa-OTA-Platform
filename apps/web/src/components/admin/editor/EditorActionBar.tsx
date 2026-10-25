"use client";

import { CalendarClock, CircleCheck, CircleDot } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { RelativeTime } from "@/components/admin/RelativeTime";
import type { ResolvedBlueprint } from "@/lib/admin/blueprints/types";
import { missingForPublish, type EditorState } from "./useEditorState";

type EditorActionBarProps = { state: EditorState; blueprint: ResolvedBlueprint };

/**
 * The sticky action bar (ADMIN.md §5.4, §8.1): what's unsaved and when it was kept on this device, Discard, and the
 * buttons the record's status allows: Save draft · Schedule… · Publish for drafts, Save · Publish now for scheduled
 * records, Update for live ones, Save for archived ones (Restore sits in the side panel). Ctrl/Cmd+S presses the
 * button marked editor-save, which never changes the status.
 */
function EditorActionBar({ state, blueprint }: EditorActionBarProps) {
  const t = useTranslations("Admin.editor.bar");
  const status = (state.saved.value as { status?: unknown } | null)?.status;
  const workflow = blueprint.workflow;
  const live = workflow && !state.isNew && status === "published";
  const scheduled = workflow && !state.isNew && status === "scheduled";
  const archived = workflow && !state.isNew && status === "archived";
  const blocked = workflow && missingForPublish(blueprint, state.value).length > 0;
  const publishBlocked = {
    disabled: state.pending || blocked,
    "aria-describedby": blocked ? "side-checklist" : undefined,
  };

  return (
    <div
      role="region"
      aria-label={t("save")}
      className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-mist-200 bg-white/95 px-4 py-3 backdrop-blur-sm md:-mx-6 md:px-6 lg:-mx-8 lg:px-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p
          className="flex min-h-10 items-center gap-2 text-[13.5px] text-mist-700"
          aria-live="polite"
        >
          {state.dirty ? (
            <>
              <CircleDot aria-hidden="true" className="size-4 text-warning-800" />
              <span className="font-semibold text-navy-900">{t("unsaved")}</span>
              {state.keptAt ? (
                <span className="hidden sm:inline">
                  ·{" "}
                  {t.rich("kept", {
                    time: () => <RelativeTime iso={new Date(state.keptAt ?? 0).toISOString()} />,
                  })}
                </span>
              ) : null}
            </>
          ) : state.isNew ? (
            <span>{t("newRecord")}</span>
          ) : (
            <>
              <CircleCheck aria-hidden="true" className="size-4 text-success-700" />
              {t("allSaved")}
            </>
          )}
        </p>
        <div className="flex flex-wrap items-center justify-end gap-2 max-sm:w-full">
          <span className="hidden items-center gap-1 text-[12.5px] text-mist-500 xl:inline-flex">
            <Kbd>Ctrl</Kbd>
            <Kbd>S</Kbd>
          </span>
          {state.dirty && !state.isNew ? (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={state.discard}
              disabled={state.pending}
            >
              {t("discard")}
            </Button>
          ) : null}
          {!workflow || archived ? (
            <Button
              id="editor-save"
              type="button"
              size="md"
              loading={state.pending}
              onClick={() => state.save("save")}
            >
              {state.isNew ? t("create") : t("save")}
            </Button>
          ) : live ? (
            <Button
              id="editor-save"
              type="button"
              size="md"
              loading={state.pending}
              onClick={() => state.save("publish")}
            >
              {t("update")}
            </Button>
          ) : (
            <>
              <Button
                id="editor-save"
                type="button"
                variant="secondary"
                size="md"
                loading={state.pending}
                onClick={() => state.save(state.isNew ? "draft" : "save")}
              >
                {scheduled ? t("save") : t("saveDraft")}
              </Button>
              {!scheduled ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  aria-label={t("schedule")}
                  {...publishBlocked}
                  onClick={state.openSchedule}
                >
                  <CalendarClock aria-hidden="true" className="size-4" />
                  {/* On phones the calendar icon alone keeps the buttons on one row (D0 R10). */}
                  <span aria-hidden="true" className="hidden sm:inline">
                    {t("schedule")}
                  </span>
                </Button>
              ) : null}
              <Button
                type="button"
                size="md"
                {...publishBlocked}
                onClick={() => state.save("publish")}
              >
                {scheduled ? t("publishNow") : t("publish")}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export { EditorActionBar };
