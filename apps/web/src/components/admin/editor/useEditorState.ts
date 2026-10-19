"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { applyAutomatic } from "@/lib/admin/blueprints/automatic";
import { dottedOf, pathsMatching } from "@/lib/admin/blueprints/paths";
import { viewOfProblem, type CurrentVersion } from "@/lib/admin/blueprints/problems";
import { slugify } from "@/lib/admin/blueprints/slug";
import type { ResolvedBlueprint } from "@/lib/admin/blueprints/types";
import { validateRecord, type FieldError } from "@/lib/admin/blueprints/validate";
import type { AdminProblem } from "@/lib/admin/adminApi";
import {
  createRecord,
  deleteRecord,
  duplicateRecord,
  saveRecord,
  saveSetting,
  type SaveResult,
} from "@/lib/admin/contentActions";
import { getAt, setAt, type JsonSchema, type Path } from "@/lib/admin/schema";
import { setNavigationGuard } from "../navigationGuard";
import { markSignedOut } from "../sessionStore";
import { useContentOptions } from "../schema/useContentOptions";
import { clearDraft, draftKey, useDraftAtLoad, writeDraft, type Draft } from "./drafts";

export type EditorMode = "setting" | "record" | "new";
/** What a save does to a record with a draft / live / archived status. */
export type SaveIntent = "save" | "draft" | "publish" | "unpublish" | "archive";

export type EditorInput = {
  mode: EditorMode;
  contentKey: string;
  recordId?: string;
  blueprint: ResolvedBlueprint;
  schema: JsonSchema;
  initial: unknown;
  version?: number;
  updatedAt?: string;
  updatedBy?: string | null;
  /** Ids already used in the list, so a new record's id is free. */
  takenIds?: string[];
};

export type EditorNotice =
  | { kind: "fields"; count: number }
  | { kind: "publish" }
  | {
      kind: "message";
      code: "forbidden" | "notFound" | "exists" | "liveLocked" | "server" | "offline";
    };

const STATUS: Record<Exclude<SaveIntent, "save">, string> = {
  draft: "draft",
  publish: "published",
  unpublish: "draft",
  archive: "archived",
};

const AUTOSAVE_AFTER = 1200;

/** Trims every text before a save, as the form shows it (ADMIN.md §6: "trims on save"). */
function trimmed(value: unknown): unknown {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(trimmed);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, trimmed(item)]),
    );
  return value;
}

const isEmpty = (value: unknown) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "") ||
  (Array.isArray(value) && value.length === 0);

/** Publish requirements that are still empty, by label (ADMIN.md §8.1). */
export function missingForPublish(blueprint: ResolvedBlueprint, value: unknown): string[] {
  return blueprint.publish
    .filter(({ path }) => {
      const paths = pathsMatching(value, path);
      return paths.length === 0 || paths.every((at) => isEmpty(getAt(value, at)));
    })
    .map(({ label }) => label);
}

/**
 * The editor's state (D0 R2): the record being edited, what's saved, problems in plain words, the draft kept on
 * this device, the unsaved-changes guard, Ctrl/Cmd+S, and every save, publish, duplicate and delete.
 */
export function useEditorState(input: EditorInput) {
  const { blueprint, schema, mode, contentKey, recordId } = input;
  const router = useRouter();
  const t = useTranslations("Admin.editor");
  const [value, setValue] = useState<unknown>(input.initial);
  const [saved, setSaved] = useState({
    value: input.initial,
    version: input.version,
    updatedAt: input.updatedAt,
    updatedBy: input.updatedBy ?? null,
  });
  const [errors, setErrors] = useState<ReadonlyMap<string, FieldError>>(() => new Map());
  const [notice, setNotice] = useState<EditorNotice | null>(null);
  const [conflict, setConflict] = useState<{
    current: CurrentVersion | null;
    intent: SaveIntent;
  } | null>(null);
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  const [keptAt, setKeptAt] = useState<number | null>(null);
  const [draftHandled, setDraftHandled] = useState(false);
  const [pending, startTransition] = useTransition();
  /** Set right before the editor reloads the page itself, so the browser doesn't ask "Leave site?". */
  const unloading = useRef(false);

  const slugPatterns = useMemo(
    () =>
      Object.entries(blueprint.fields)
        .filter(([, field]) => field.widget === "slug")
        .map(([pattern]) => pattern),
    [blueprint],
  );
  const [following, setFollowing] = useState<ReadonlySet<string>>(
    () =>
      new Set(
        slugPatterns.filter(
          (pattern) => mode === "new" || isEmpty(getAt(input.initial, [pattern])),
        ),
      ),
  );

  const isNew = mode === "new";
  const storage = draftKey(contentKey, recordId ?? (mode === "setting" ? "setting" : "new"));
  const instance = useId();
  const loadedDraft = useDraftAtLoad(storage, instance);
  const dirty = useMemo(
    () => JSON.stringify(value) !== JSON.stringify(saved.value),
    [value, saved.value],
  );
  const live =
    !isNew &&
    blueprint.workflow &&
    (saved.value as { status?: unknown } | null)?.status === "published";

  // Store categories need their parent's level (levelFromParent).
  const needsLevels = Object.values(blueprint.fields).some(
    (field) => field.auto === "levelFromParent",
  );
  const categories = useContentOptions(needsLevels ? "categories" : undefined);
  const levelOf = useCallback(
    (id: string) => {
      const option = categories.items.find((item) => item.values.id === id);
      const level = option ? Number(option.values.level) : Number.NaN;
      return Number.isFinite(level) ? level : undefined;
    },
    [categories.items],
  );

  /** Re-checks fields that already show a problem, so it clears as soon as it's fixed. */
  const recheck = useCallback(
    (next: unknown) => {
      if (errors.size === 0) return;
      const found = validateRecord(schema, next, blueprint);
      const kept = new Map<string, FieldError>();
      for (const [key] of errors) {
        const problem = found.get(key);
        if (problem) kept.set(key, problem);
      }
      setErrors(kept);
    },
    [errors, schema, blueprint],
  );

  const change = useCallback(
    (path: Path, next: unknown) => {
      let updated = setAt(value, path, next);
      if (path.length === 1 && typeof path[0] === "string") {
        const name = path[0];
        if (slugPatterns.includes(name) && following.has(name)) {
          const rest = new Set(following);
          rest.delete(name);
          setFollowing(rest);
        }
        for (const pattern of slugPatterns) {
          const source = blueprint.fields[pattern]?.source ?? "title";
          if (source === name && following.has(pattern) && typeof next === "string")
            updated = setAt(updated, [pattern], slugify(next, 80));
        }
      }
      setValue(updated);
      recheck(updated);
    },
    [value, slugPatterns, following, blueprint, recheck],
  );

  const update = useCallback(
    (path: Path, fn: (current: unknown) => unknown) => change(path, fn(getAt(value, path))),
    [change, value],
  );

  const touch = useCallback(
    (path: Path) => {
      const key = dottedOf(path);
      const problem = validateRecord(schema, value, blueprint).get(key);
      setErrors((current) => {
        if (!problem && !current.has(key)) return current;
        const next = new Map(current);
        if (problem) next.set(key, problem);
        else next.delete(key);
        return next;
      });
    },
    [schema, value, blueprint],
  );

  // Keep the draft on this device a moment after each change; drop it once everything is saved.
  useEffect(() => {
    if (!dirty) {
      clearDraft(storage);
      return;
    }
    const timer = window.setTimeout(() => {
      const draft: Draft = {
        value,
        savedAt: Date.now(),
        ...(saved.version ? { baseVersion: saved.version } : {}),
      };
      if (writeDraft(storage, draft)) setKeptAt(draft.savedAt);
    }, AUTOSAVE_AFTER);
    return () => window.clearTimeout(timer);
  }, [dirty, value, storage, saved.version]);

  // The unsaved-changes guard: closing the tab, links on the page, and Ctrl K / + New navigations.
  useEffect(() => {
    if (!dirty) {
      setNavigationGuard(null);
      return;
    }
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!unloading.current) event.preventDefault();
    };
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      )
        return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search)
        return;
      event.preventDefault();
      event.stopPropagation();
      setLeaveTo(`${url.pathname}${url.search}${url.hash}`);
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", onClick, true);
    setNavigationGuard((href) => {
      setLeaveTo(href);
      return true;
    });
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", onClick, true);
      setNavigationGuard(null);
    };
  }, [dirty]);

  const report = (problem: AdminProblem, intent: SaveIntent) => {
    const view = viewOfProblem(problem, validateRecord(schema, value, blueprint));
    if (view.kind === "fields") {
      setErrors(view.errors);
      setNotice({ kind: "fields", count: view.errors.size });
    } else if (view.kind === "stale") {
      setConflict({ current: view.current ?? null, intent });
    } else if (view.kind === "signedOut") {
      markSignedOut();
    } else {
      setNotice({ kind: "message", code: view.code });
      toast.error(t(`errors.${view.code}`));
    }
  };

  const save = (intent: SaveIntent, options: { version?: number } = {}) => {
    const withStatus =
      blueprint.workflow && intent !== "save" ? setAt(value, ["status"], STATUS[intent]) : value;
    const prepared = applyAutomatic(trimmed(withStatus), blueprint, {
      isNew,
      now: new Date(),
      ...(input.takenIds ? { takenIds: input.takenIds } : {}),
      levelOf,
    });
    const found = validateRecord(schema, prepared, blueprint);
    if (found.size > 0) {
      setErrors(found);
      setNotice({ kind: "fields", count: found.size });
      return;
    }
    if (intent === "publish" && missingForPublish(blueprint, prepared).length > 0) {
      setNotice({ kind: "publish" });
      return;
    }
    const version = options.version ?? saved.version;
    startTransition(async () => {
      let result: SaveResult;
      try {
        result =
          mode === "setting"
            ? await saveSetting(contentKey, prepared, version)
            : mode === "new"
              ? await createRecord(contentKey, prepared)
              : await saveRecord(contentKey, recordId ?? "", prepared, version);
      } catch {
        result = {
          ok: false,
          problem: { status: navigator.onLine ? 500 : 0, title: "Unavailable" },
        };
      }
      if (!result.ok) {
        report(result.problem, intent);
        return;
      }
      clearDraft(storage);
      setValue(prepared);
      setSaved({
        value: prepared,
        version: result.version,
        updatedAt: result.updatedAt ?? new Date().toISOString(),
        updatedBy: result.updatedBy ?? null,
      });
      setErrors(new Map());
      setNotice(null);
      setFollowing(new Set());
      const words =
        intent === "publish"
          ? live
            ? t("toast.updated")
            : t("toast.published")
          : intent === "unpublish"
            ? t("toast.unpublished")
            : intent === "archive"
              ? t("toast.archived")
              : isNew
                ? t("toast.created")
                : t("toast.saved");
      toast.success(words);
      if (mode !== "setting" && result.id && (isNew || result.id !== recordId)) {
        router.replace(
          `/secure-admin-control/content/${contentKey}/${encodeURIComponent(result.id)}`,
        );
      } else {
        router.refresh();
      }
    });
  };

  const discard = () => {
    setValue(saved.value);
    setErrors(new Map());
    setNotice(null);
    clearDraft(storage);
  };

  const restoreDraft = () => {
    if (loadedDraft) setValue(loadedDraft.value);
    setDraftHandled(true);
  };
  const dropDraft = () => {
    clearDraft(storage);
    setDraftHandled(true);
  };

  const resolveConflict = (choice: "reload" | "keep") => {
    const open = conflict;
    setConflict(null);
    if (!open) return;
    if (choice === "reload") {
      // Keep this person's work on the device; the reloaded page offers it back.
      writeDraft(storage, {
        value,
        savedAt: Date.now(),
        ...(open.current ? { baseVersion: open.current.version } : {}),
      });
      setNavigationGuard(null);
      unloading.current = true;
      window.location.reload();
      return;
    }
    save(open.intent, open.current ? { version: open.current.version } : {});
  };

  const leave = () => {
    const target = leaveTo;
    setLeaveTo(null);
    if (!target) return;
    setNavigationGuard(null);
    // The draft stays on the device, so the work can be restored on return.
    writeDraft(storage, {
      value,
      savedAt: Date.now(),
      ...(saved.version ? { baseVersion: saved.version } : {}),
    });
    setSaved((current) => ({ ...current, value }));
    router.push(target);
  };

  const duplicate = () =>
    startTransition(async () => {
      if (!recordId) return;
      const result = await duplicateRecord(contentKey, recordId);
      if (!result.ok) {
        report(result.problem, "save");
        return;
      }
      const target = `/secure-admin-control/content/${contentKey}/${encodeURIComponent(result.id ?? "")}`;
      toast.success(t("side.duplicated"), {
        action: { label: t("toast.view"), onClick: () => router.push(target) },
      });
    });

  const remove = () =>
    startTransition(async () => {
      if (!recordId) return;
      const result = await deleteRecord(contentKey, recordId);
      if (!result.ok) {
        report(result.problem, "save");
        return;
      }
      clearDraft(storage);
      setNavigationGuard(null);
      setSaved((current) => ({ ...current, value }));
      toast.success(t("side.deleted"));
      router.push(`/secure-admin-control/content/${contentKey}`);
    });

  // Ctrl/Cmd+S saves (keeping the record's status).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        document.getElementById("editor-save")?.click();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const showDraft =
    !draftHandled &&
    loadedDraft !== null &&
    JSON.stringify(loadedDraft.value) !== JSON.stringify(input.initial);

  return {
    value,
    saved,
    dirty,
    pending,
    errors,
    notice,
    conflict,
    leaveTo,
    keptAt,
    isNew,
    live,
    draft: showDraft ? loadedDraft : null,
    draftIsOlder:
      showDraft &&
      typeof loadedDraft?.baseVersion === "number" &&
      typeof input.version === "number" &&
      loadedDraft.baseVersion < input.version,
    slugFollows: (pattern: string) => following.has(pattern),
    change,
    update,
    touch,
    save,
    discard,
    restoreDraft,
    dropDraft,
    resolveConflict,
    stay: () => setLeaveTo(null),
    leave,
    duplicate,
    remove,
    dismissNotice: () => setNotice(null),
  };
}

export type EditorState = ReturnType<typeof useEditorState>;
