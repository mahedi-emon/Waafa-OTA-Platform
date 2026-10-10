"use client";

import {
  isNullable,
  resolve,
  typeOf,
  unionOf,
  type JsonSchema,
  type Path,
} from "@/lib/admin/schema";
import { ArrayField } from "./ArrayField";
import { ObjectField } from "./ObjectField";
import { RawJsonField } from "./RawJsonField";
import { ScalarField } from "./ScalarField";
import { UnionField } from "./UnionField";
import { useSchemaEditor } from "./useSchemaEditor";

type SchemaFieldProps = {
  schema: JsonSchema;
  path: Path;
  value: unknown;
  optional: boolean;
  /** Draw an object's fields without a frame (list items, the record itself). */
  bare?: boolean;
};

/** Picks the control for a schema node: group, list, kind picker, scalar, or JSON for anything else. */
function SchemaField({ schema, path, value, optional, bare = false }: SchemaFieldProps) {
  const { root } = useSchemaEditor();
  const node = resolve(schema, root);
  if (node.const !== undefined) return null;
  const union = unionOf(node, root);
  if (union) {
    return (
      <UnionField
        options={union.options}
        nullable={union.nullable}
        path={path}
        value={value}
        optional={optional}
      />
    );
  }
  const type = typeOf(node);
  const nullable = isNullable(node, root);
  if (type === "object") {
    if (!node.properties) return <RawJsonField path={path} value={value} optional={optional} />;
    return (
      <ObjectField
        schema={node}
        path={path}
        value={value}
        optional={optional || nullable}
        bare={bare}
      />
    );
  }
  if (type === "array")
    return <ArrayField schema={node} path={path} value={value} optional={optional} />;
  if (type === "string" || type === "number" || type === "integer" || type === "boolean") {
    return (
      <ScalarField
        schema={node}
        path={path}
        value={value}
        optional={optional}
        nullable={nullable}
      />
    );
  }
  return <RawJsonField path={path} value={value} optional={optional} />;
}

export { SchemaField };
