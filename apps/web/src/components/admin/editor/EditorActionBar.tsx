"use client";

import { CircleCheck, CircleDot } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { RelativeTime } from "@/components/admin/RelativeTime";
import type { ResolvedBlueprint } from "@/lib/admin/blueprints/types";
import { missingForPublish, type EditorState } from "./useEditorState";

type EditorActionBarProps = { state: EditorState; blueprint: ResolvedBlueprint };

/**
 * The sticky action bar (ADMIN.md §5.4): what's unsaved and when it was kept on this device, Discard, Save draft and
 * Publish or Update. Ctrl/Cmd+S presses the button marked editor-save (save, keeping the status).
 */
function EditorActionBar({ state, blueprint }: EditorActionBarProps) {
  const t = useTranslations("Admin.editor.bar");
  const status = (state.saved.value as { status?: unknown } | null)?.status;
  const live = blueprint.workflow && !state.isNew && status === "published";
  const blocked = blueprint.workflow && missingForPublish(blueprint, state.value).length > 0;

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
        <div className="flex flex-wrap items-center gap-2">
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
          {blueprint.workflow && !live ? (
            <>
              <Button
                id="editor-save"
                type="button"
                variant="secondary"
                size="md"
                loading={state.pending}
                onClick={() => state.save(state.isNew ? "draft" : "save")}
              >
                {t("saveDraft")}
              </Button>
              <Button
                type="button"
                size="md"
                disabled={state.pending || blocked}
                aria-describedby={blocked ? "side-checklist" : undefined}
                onClick={() => state.save("publish")}
              >
                {t("publish")}
              </Button>
            </>
          ) : (
            <Button
              id="editor-save"
              type="button"
              size="md"
              loading={state.pending}
              onClick={() => state.save(live ? "publish" : "save")}
            >
              {live ? t("update") : state.isNew ? t("create") : t("save")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export { EditorActionBar };
