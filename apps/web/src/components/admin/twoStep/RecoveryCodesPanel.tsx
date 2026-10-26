"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type RecoveryCodesPanelProps = {
  codes: string[];
  email?: string;
  strings: {
    codesLabel: string;
    copy: string;
    copied: string;
    download: string;
    fileName: string;
    fileTitle: string;
    fileNote: string;
  };
};

/**
 * The ten recovery codes, shown once after setup (issue 234): copy them (confirmed in words, no toast, so it works on
 * the sign-in page too), or save them as a text file.
 */
function RecoveryCodesPanel({ codes, email, strings }: RecoveryCodesPanelProps) {
  const [copied, setCopied] = useState(false);
  const text = [
    strings.fileTitle,
    ...(email ? [email] : []),
    "",
    ...codes,
    "",
    strings.fileNote,
  ].join("\n");

  function copy() {
    navigator.clipboard
      .writeText(codes.join("\n"))
      .then(() => setCopied(true))
      .catch(() => undefined);
  }

  function download() {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = strings.fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-3">
      <ol
        aria-label={strings.codesLabel}
        className="grid grid-cols-1 gap-x-6 gap-y-1.5 rounded-2xl border border-mist-200 bg-mist-25 p-4 font-mono text-[15px] font-semibold tracking-wide text-navy-900 tabular-nums min-[360px]:grid-cols-2"
      >
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={copy}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {strings.copy}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={download}>
          <Download aria-hidden="true" />
          {strings.download}
        </Button>
      </div>
      <p role="status" className="min-h-5 text-[13.5px] font-medium text-success-700">
        {copied ? strings.copied : ""}
      </p>
    </div>
  );
}

export { RecoveryCodesPanel };
