"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ResolvedSection } from "@/lib/admin/blueprints/types";
import { scrollToSection } from "./scrollToSection";

type EditorSectionJumpProps = { sections: ResolvedSection[] };

/** Below 1024 px: "Jump to a section" instead of the section list. */
function EditorSectionJump({ sections }: EditorSectionJumpProps) {
  const t = useTranslations("Admin.editor.rail");
  if (sections.length < 2) return null;
  return (
    <div className="lg:hidden">
      <Select value="" onValueChange={(id) => scrollToSection(id)}>
        <SelectTrigger aria-label={t("jump")} className="h-11 w-full bg-white">
          <SelectValue placeholder={t("jump")} />
        </SelectTrigger>
        <SelectContent>
          {sections.map((section) => (
            <SelectItem key={section.id} value={section.id}>
              {section.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export { EditorSectionJump };
