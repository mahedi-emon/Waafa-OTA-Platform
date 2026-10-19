"use client";

import { useMemo } from "react";
import { cn } from "cn";
import type { ResolvedSection } from "@/lib/admin/blueprints/types";
import { resolve } from "@/lib/admin/schema";
import { fieldId } from "../schema/fieldIds";
import { ObjectField } from "../schema/ObjectField";
import { SchemaField } from "../schema/SchemaField";
import { SectionLabelContext, type SectionLabel } from "../schema/useQuietLabel";
import { useSchemaEditor } from "../schema/useSchemaEditor";
import { isWide } from "../schema/wideWidgets";

type EditorSectionProps = { section: ResolvedSection };

/**
 * One section of the editor: a title, a line of help and its fields (ADMIN.md §5.4). A section made of one group
 * draws the group's own fields; a section of the record itself (a list setting) draws that list.
 */
function EditorSection({ section }: EditorSectionProps) {
  const editor = useSchemaEditor();
  const root = editor.root;
  const record = (editor.value && typeof editor.value === "object" ? editor.value : {}) as Record<
    string,
    unknown
  >;
  const required = new Set(root.required ?? []);
  const only = section.fields.length === 1 ? section.fields[0] : undefined;
  const onlyField = only !== undefined ? editor.blueprint.fields[only] : undefined;
  const shown = section.fields.filter((name) => !editor.blueprint.fields[name]?.hidden);
  const single = shown.length === 1 ? shown[0] : undefined;
  // The one field of a section named like it ("Delivery zones" in Delivery zones) doesn't repeat the name.
  const label = useMemo<SectionLabel | null>(
    () =>
      single === undefined
        ? null
        : { title: section.title, id: fieldId(single === "" ? [] : [single]) },
    [single, section.title],
  );

  let body;
  if (only === "") {
    body = <SchemaField schema={root} path={[]} value={editor.value} optional={false} />;
  } else if (only && onlyField?.widget === "group") {
    body = (
      <ObjectField
        schema={resolve(root.properties?.[only] ?? {}, root)}
        path={[only]}
        value={record[only]}
        optional={!required.has(only)}
        bare
      />
    );
  } else {
    body = (
      <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
        {section.fields.map((name) => {
          const field = editor.blueprint.fields[name];
          if (field?.hidden) return null;
          const wide = isWide(field, resolve(root.properties?.[name] ?? {}, root));
          // A group named like its section (Office hours in Office hours) draws without a second title.
          const plainGroup = field?.widget === "group" && field.label === section.title;
          return (
            <div key={name} className={cn("min-w-0", wide && "md:col-span-2")}>
              {plainGroup ? (
                <ObjectField
                  schema={resolve(root.properties?.[name] ?? {}, root)}
                  path={[name]}
                  value={record[name]}
                  optional={!required.has(name)}
                  bare
                />
              ) : (
                <SchemaField
                  schema={root.properties?.[name] ?? {}}
                  path={[name]}
                  value={record[name]}
                  optional={!required.has(name)}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <section
      id={`section-${section.id}`}
      aria-labelledby={`section-${section.id}-title`}
      className="scroll-mt-24 rounded-2xl border border-mist-200 bg-white p-4 shadow-xs sm:p-6"
    >
      <header className="mb-5">
        <h2
          id={`section-${section.id}-title`}
          className="font-display text-[18px] leading-tight font-bold text-navy-900"
        >
          {section.title}
        </h2>
        {section.lead ? <p className="mt-1 text-[14px] text-mist-600">{section.lead}</p> : null}
      </header>
      <SectionLabelContext.Provider value={label}>{body}</SectionLabelContext.Provider>
    </section>
  );
}

export { EditorSection };
