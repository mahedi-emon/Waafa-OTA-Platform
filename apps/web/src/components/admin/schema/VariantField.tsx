"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAt, type Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { useContentOptions } from "./useContentOptions";
import { useField } from "./useField";
import { useSchemaEditor } from "./useSchemaEditor";

type VariantFieldProps = { path: Path; value: unknown; optional: boolean };

type Variant = { id: string; sku: string; options?: Record<string, string> };
type Loaded = { docId: string; status: "loading" | "ready" | "failed"; variants: Variant[] };

/** One variant of the product chosen next to it (a deal's variant), by its stock code and options. */
function VariantField({ path, value, optional }: VariantFieldProps) {
  const editor = useSchemaEditor();
  const meta = useField(path);
  const t = useTranslations("Admin.editor.widgets");
  const productId = getAt(editor.value, [
    ...path.slice(0, -1),
    meta.field.variantOf ?? "productId",
  ]);
  const products = useContentOptions("products");
  const docId =
    typeof productId === "string" && productId
      ? products.items.find((option) => option.values.id === productId)?.id
      : undefined;
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!docId) return;
    let live = true;
    fetch(`/secure-admin-control/api/content/products/${encodeURIComponent(docId)}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        const body = (await response.json()) as { data?: { variants?: Variant[] } };
        if (live) setLoaded({ docId, status: "ready", variants: body.data?.variants ?? [] });
      })
      .catch(() => {
        if (live) setLoaded({ docId, status: "failed", variants: [] });
      });
    return () => {
      live = false;
    };
  }, [docId]);

  const current = typeof value === "string" ? value : "";
  const state = docId && loaded?.docId === docId ? loaded : null;
  const words = (variant: Variant) =>
    [variant.sku, ...Object.values(variant.options ?? {})].filter(Boolean).join(" · ");

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      help={
        !docId
          ? t("variant.pickProduct")
          : !state
            ? t("variant.loading")
            : state.status === "ready" && state.variants.length === 0
              ? t("variant.none")
              : meta.help
      }
      optional={optional}
      {...(meta.error ? { error: meta.error } : {})}
    >
      <Select
        value={current}
        onValueChange={(next) => meta.change(next)}
        disabled={!state || state.variants.length === 0}
      >
        <SelectTrigger
          id={meta.id}
          aria-describedby={meta.describedBy}
          aria-invalid={meta.error ? true : undefined}
          className="h-11 w-full max-w-md"
          onBlur={meta.touch}
        >
          <SelectValue placeholder={t("choose")} />
        </SelectTrigger>
        <SelectContent>
          {(state?.variants ?? []).map((variant) => (
            <SelectItem key={variant.id} value={variant.id}>
              {words(variant)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}

export { VariantField };
