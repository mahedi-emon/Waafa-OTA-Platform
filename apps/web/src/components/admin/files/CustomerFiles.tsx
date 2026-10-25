import { CircleAlert, ExternalLink, FileImage, FileText } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { CustomerFileOwner } from "@waafa/shared";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { Button } from "@/components/ui/button";
import { listCustomerFiles } from "@/lib/admin/customerFiles";
import { formatDhakaDateTime } from "@/lib/admin/format";
import { formatFileSize } from "@/lib/visa/visaFiles";

/** A file the record's form named (its payload), so a file that never arrived still shows. */
export type ExpectedFile = { fileName: string; kind: string; storageKey?: string };

type CustomerFilesProps = {
  owner: CustomerFileOwner;
  id: string;
  expected: readonly ExpectedFile[];
  className?: string;
};

const KINDS = [
  "passport-bio",
  "photo",
  "bank-statement",
  "invitation",
  "payment-proof",
  "other",
] as const;
type Kind = (typeof KINDS)[number];
const isKind = (value: string): value is Kind => (KINDS as readonly string[]).includes(value);

/** The address that opens a file for staff (a ten-minute signed link, audited; issue 232). */
export function customerFileHref(storageKey: string): string {
  return `/secure-admin-control/files/${storageKey}`;
}

/**
 * What the customer sent with the form (issue 232): each file opens in a new tab through a signed link the API logs.
 * Files the form named but that never arrived are listed with what to do. Nothing renders when there are no files.
 */
async function CustomerFiles({ owner, id, expected, className }: CustomerFilesProps) {
  const [t, rows] = await Promise.all([
    getTranslations("Admin.files"),
    listCustomerFiles(owner, id),
  ]);
  const arrived = new Set(rows.map((row) => row.storageKey));
  const missing = expected.filter((file) => !file.storageKey || !arrived.has(file.storageKey));
  if (rows.length === 0 && missing.length === 0) return null;
  const kind = (value: string) => t(`kinds.${isKind(value) ? value : "other"}`);

  return (
    <AdminPanel id={`files-${id}`} title={t("title")} lead={t("lead")} className={className}>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => {
          const Icon = row.mimeType === "application/pdf" ? FileText : FileImage;
          return (
            <li
              key={row.storageKey}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-mist-200 px-3 py-2.5"
            >
              <Icon aria-hidden="true" className="size-5 shrink-0 text-brand-700" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium text-ink-900">
                  {row.fileName}
                </span>
                <span className="block text-[12.5px] text-mist-600 tabular-nums">
                  {kind(row.kind)} · {formatFileSize(row.sizeBytes)} ·{" "}
                  {formatDhakaDateTime(row.createdAt)}
                </span>
              </span>
              <Button asChild variant="secondary" size="sm">
                <a
                  href={customerFileHref(row.storageKey)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("openLabel", { name: row.fileName })}
                >
                  {t("open")}
                  <ExternalLink aria-hidden="true" />
                </a>
              </Button>
            </li>
          );
        })}
        {missing.map((file, index) => (
          <li
            key={`${file.fileName}-${index}`}
            className="flex items-start gap-3 rounded-xl border border-warning-700/30 bg-warning-50 px-3 py-2.5"
          >
            <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning-800" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-medium text-ink-900">
                {file.fileName}
              </span>
              <span className="block text-[12.5px] text-warning-800">
                {kind(file.kind)} · {file.storageKey ? t("notReceived") : t("nameOnly")}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </AdminPanel>
  );
}

export { CustomerFiles };
