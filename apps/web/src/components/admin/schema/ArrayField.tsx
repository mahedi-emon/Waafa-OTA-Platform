"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { humanize } from "@/lib/admin/format";
import {
  defaultFor,
  pathKey,
  resolve,
  summaryOf,
  typeOf,
  type JsonSchema,
  type Path,
} from "@/lib/admin/schema";
import { SchemaField } from "./SchemaField";
import { useSchemaEditor } from "./useSchemaEditor";

type ArrayFieldProps = { schema: JsonSchema; path: Path; value: unknown; optional: boolean };

/**
 * A list (repeater): each item in its own card with move up, move down and remove; "Add" appends a fresh item built
 * from the schema. Lists of short words are edited inline.
 */
function ArrayField({ schema, path, value, optional }: ArrayFieldProps) {
  const { root, errors, strings, change } = useSchemaEditor();
  const items = Array.isArray(value) ? value : [];
  const itemSchema = resolve(
    (Array.isArray(schema.items) ? schema.items[0] : schema.items) ?? {},
    root,
  );
  const simple =
    ["string", "number", "integer"].includes(typeOf(itemSchema) ?? "") && !itemSchema.anyOf;
  const key = path.at(-1);
  const label = typeof key === "number" ? `${key + 1}` : humanize(String(key ?? ""));
  const error = errors[pathKey(path)];
  const max = schema.maxItems ?? Number.POSITIVE_INFINITY;

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const copy = [...items];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    change(path, copy);
  };
  const remove = (index: number) =>
    change(
      path,
      items.filter((_, position) => position !== index),
    );
  const add = () => change(path, [...items, defaultFor(itemSchema, root)]);

  return (
    <fieldset className="flex min-w-0 flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-3 sm:p-4">
      <legend className="px-1 text-[14px] font-bold text-navy-900">
        {label}
        {optional ? (
          <span className="ml-1.5 text-[12.5px] font-normal text-mist-500">
            ({strings.optional})
          </span>
        ) : null}
      </legend>
      {error ? (
        <p role="alert" className="text-[13px] font-medium text-danger-600">
          {error}
        </p>
      ) : null}
      {items.length === 0 ? (
        <p className="text-[13.5px] text-mist-600">{strings.emptyList}</p>
      ) : null}
      <ol className="flex min-w-0 flex-col gap-3">
        {items.map((item, index) => (
          <li
            key={index}
            className={
              simple
                ? "flex min-w-0 items-end gap-2"
                : "min-w-0 rounded-xl border border-mist-200 bg-mist-25 p-2.5 sm:p-3"
            }
          >
            {simple ? null : (
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-[13.5px] font-semibold text-mist-700">
                  {index + 1}. {summaryOf(item)}
                </p>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={strings.itemUp}
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                  >
                    <ArrowUp aria-hidden="true" className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={strings.itemDown}
                    disabled={index === items.length - 1}
                    onClick={() => move(index, index + 1)}
                  >
                    <ArrowDown aria-hidden="true" className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={strings.removeItem}
                    onClick={() => remove(index)}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </Button>
                </div>
              </div>
            )}
            <div className={simple ? "min-w-0 flex-1" : "min-w-0"}>
              <SchemaField
                schema={itemSchema}
                path={[...path, index]}
                value={item}
                optional={false}
                bare={!simple}
              />
            </div>
            {simple ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={strings.removeItem}
                onClick={() => remove(index)}
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </Button>
            ) : null}
          </li>
        ))}
      </ol>
      {items.length < max ? (
        <div>
          <Button type="button" variant="soft" size="sm" onClick={add}>
            <Plus aria-hidden="true" className="size-4" />
            {strings.addItem}
          </Button>
        </div>
      ) : null}
    </fieldset>
  );
}

export { ArrayField };
