"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import type { SaveResult } from "@/lib/admin/contentActions";
import { setAt, type JsonSchema, type Path } from "@/lib/admin/schema";
import { SchemaField } from "./SchemaField";
import { SchemaEditorContext, type SchemaEditorStrings } from "./useSchemaEditor";

type SchemaEditorProps = {
  schema: JsonSchema;
  initial: unknown;
  version?: number;
  /** Saves the value; for a new record the result carries its id. */
  onSave: (data: unknown, version?: number) => Promise<SaveResult>;
  /** After a save that returns a different id (a new record, a new slug), go to this path plus the id. */
  recordBase?: string;
  /** The id the page shows, so a renamed record moves to its new address. */
  recordId?: string;
  strings: SchemaEditorStrings & {
    fieldsTab: string;
    jsonTab: string;
    jsonHint: string;
    save: string;
    saved: string;
    failed: string;
    conflict: string;
    forbidden: string;
    unsaved: string;
  };
};

/**
 * The generic content editor (D138): a form drawn from the record's JSON Schema, a JSON tab for anything the form
 * can't draw, and Save. The API validates with the shared schema; its field errors appear next to the fields.
 */
function SchemaEditor({
  schema,
  initial,
  version,
  onSave,
  recordBase,
  recordId,
  strings,
}: SchemaEditorProps) {
  const router = useRouter();
  const [value, setValue] = useState<unknown>(initial);
  const [currentVersion, setCurrentVersion] = useState(version);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"fields" | "json">("fields");
  const [json, setJson] = useState("");
  const [jsonError, setJsonError] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const change = useCallback((path: Path, next: unknown) => {
    setValue((current: unknown) => setAt(current, path, next));
    setDirty(true);
  }, []);

  const context = useMemo(
    () => ({ root: schema, errors, strings, change }),
    [schema, errors, strings, change],
  );

  function openJson() {
    setJson(JSON.stringify(value, null, 2));
    setJsonError(false);
    setTab("json");
  }

  function save() {
    let data = value;
    if (tab === "json") {
      try {
        data = JSON.parse(json);
        setValue(data);
      } catch {
        setJsonError(true);
        return;
      }
    }
    setErrors({});
    startTransition(async () => {
      const result = await onSave(data, currentVersion);
      if (!result.ok) {
        const { problem } = result;
        if (problem.fields?.length) {
          setErrors(Object.fromEntries(problem.fields.map((field) => [field.path, field.message])));
          setTab("fields");
        }
        toast.error(
          problem.status === 409 && problem.code === "stale"
            ? strings.conflict
            : problem.status === 403
              ? strings.forbidden
              : (problem.detail ?? strings.failed),
        );
        return;
      }
      setCurrentVersion(result.version);
      setDirty(false);
      toast.success(strings.saved);
      if (result.id && recordBase && result.id !== recordId)
        router.push(recordBase + encodeURIComponent(result.id));
      else router.refresh();
    });
  }

  const errorCount = Object.keys(errors).length;

  return (
    <SchemaEditorContext.Provider value={context}>
      <div className="flex flex-col gap-4">
        <div className="flex gap-1 self-start rounded-full bg-mist-100 p-1" role="group">
          <button
            type="button"
            aria-pressed={tab === "fields"}
            onClick={() => setTab("fields")}
            className={cn(
              "min-h-10 cursor-pointer rounded-full px-4 text-[14px] font-semibold",
              tab === "fields" ? "bg-white text-navy-900 shadow-sm" : "text-mist-600",
            )}
          >
            {strings.fieldsTab}
          </button>
          <button
            type="button"
            aria-pressed={tab === "json"}
            onClick={openJson}
            className={cn(
              "min-h-10 cursor-pointer rounded-full px-4 text-[14px] font-semibold",
              tab === "json" ? "bg-white text-navy-900 shadow-sm" : "text-mist-600",
            )}
          >
            {strings.jsonTab}
          </button>
        </div>

        {errorCount > 0 ? (
          <div role="alert" className="rounded-2xl bg-danger-50 p-4 text-[14px] text-danger-600">
            <p className="font-semibold">{strings.failed}</p>
            <ul className="mt-1 list-disc pl-5">
              {Object.entries(errors)
                .slice(0, 8)
                .map(([path, message]) => (
                  <li key={path}>
                    <span className="font-mono text-[12.5px]">{path || "record"}</span>: {message}
                  </li>
                ))}
            </ul>
          </div>
        ) : null}

        {tab === "fields" ? (
          <SchemaField schema={schema} path={[]} value={value} optional={false} bare />
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-[13.5px] text-mist-600">{strings.jsonHint}</p>
            <Textarea
              value={json}
              spellCheck={false}
              onChange={(event) => {
                setJson(event.target.value);
                setDirty(true);
                setJsonError(false);
              }}
              aria-invalid={jsonError ? true : undefined}
              className="min-h-[480px] font-mono text-[13px]"
            />
            {jsonError ? (
              <p role="alert" className="text-[13.5px] font-medium text-danger-600">
                {strings.jsonInvalid}
              </p>
            ) : null}
          </div>
        )}

        <div className="sticky bottom-0 z-10 -mx-5 flex items-center gap-3 border-t border-mist-200 bg-white/95 px-5 py-3 backdrop-blur-sm">
          <Button onClick={save} loading={pending}>
            {strings.save}
          </Button>
          {dirty ? <span className="text-[13px] text-mist-600">{strings.unsaved}</span> : null}
        </div>
      </div>
    </SchemaEditorContext.Provider>
  );
}

export { SchemaEditor };
