"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import type { Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { useField } from "./useField";

type RichTextFieldProps = { path: Path; value: unknown; optional: boolean; nullable: boolean };

// The editor (tiptap) loads only when a rich text field is on screen (issue 116).
const RichTextEditor = dynamic(() => import("./RichTextEditor").then((mod) => mod.RichTextEditor), {
  ssr: false,
  loading: () => <Skeleton className="h-60 rounded-xl" />,
});

/** Headings, lists and links for pages, posts and guides; the site sanitises what it shows. */
function RichTextField({ path, value, optional, nullable }: RichTextFieldProps) {
  const meta = useField(path);
  const t = useTranslations("Admin.content.richText");
  const html = typeof value === "string" ? value : "";

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      {...(meta.help ? { help: meta.help } : {})}
      optional={optional}
      {...(meta.error ? { error: meta.error } : {})}
    >
      <RichTextEditor
        id={meta.id}
        label={meta.label}
        value={html}
        onChange={(next) =>
          meta.change(next === "" && optional ? undefined : next === "" && nullable ? null : next)
        }
        {...(meta.describedBy ? { describedBy: meta.describedBy } : {})}
        invalid={Boolean(meta.error)}
        strings={{
          toolbar: t("toolbar"),
          paragraph: t("paragraph"),
          heading3: t("heading3"),
          bold: t("bold"),
          italic: t("italic"),
          bulletList: t("bulletList"),
          orderedList: t("orderedList"),
          quote: t("quote"),
          link: t("link"),
          unlink: t("unlink"),
          linkPrompt: t("linkPrompt"),
          undo: t("undo"),
          redo: t("redo"),
        }}
      />
    </FieldShell>
  );
}

export { RichTextField };
