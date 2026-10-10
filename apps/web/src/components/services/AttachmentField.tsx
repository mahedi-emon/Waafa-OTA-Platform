"use client";

import { useTranslations } from "next-intl";
import { DocumentSlot, type SlotFile } from "@/components/forms/DocumentSlot";

type AttachmentFieldProps = { file: SlotFile | null; onChange: (file: SlotFile | null) => void };

/** Optional attachment on a service request. Phase A keeps the file in the browser; name, type and size are sent. */
function AttachmentField({ file, onChange }: AttachmentFieldProps) {
  const t = useTranslations("Services.attach");
  return (
    <DocumentSlot
      title={t("title")}
      sub={t("sub")}
      file={file}
      onChange={onChange}
      labels={{
        choose: t("choose"),
        replace: t("replace"),
        rule: t("rule"),
        remove: t("remove", { file: "{file}" }),
        added: t("added"),
        errors: { fileType: t("fileType"), fileSize: t("fileSize"), fileEmpty: t("fileEmpty") },
      }}
    />
  );
}

export { AttachmentField };
