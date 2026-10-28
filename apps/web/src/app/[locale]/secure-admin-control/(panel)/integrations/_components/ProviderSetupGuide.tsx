"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { ProviderSetup } from "@waafa/shared";
import { Button } from "@/components/ui/button";

type ProviderSetupGuideProps = {
  setup: ProviderSetup;
  /** This site's address; panel paths are shown in full under it. */
  origin: string;
  serverIp: string | null;
  strings: { title: string; values: string; copy: string; copied: string; noIp: string };
};

/** One value to paste into the provider's panel, with a Copy button that says it copied. */
function CopyRow({
  label,
  value,
  strings,
}: {
  label: string;
  value: string;
  strings: ProviderSetupGuideProps["strings"];
}) {
  const [copied, setCopied] = useState(false);
  return (
    <li className="flex flex-col gap-1.5 rounded-lg border border-mist-200 bg-mist-50 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-[12.5px] font-semibold text-mist-600">{label}</p>
        <p className="font-mono text-[13px] break-all text-ink-900">{value}</p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="shrink-0 self-start sm:self-center"
        aria-label={`${copied ? strings.copied : strings.copy} ${label}`}
        onClick={() => {
          void navigator.clipboard?.writeText(value).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          });
        }}
      >
        {copied ? (
          <Check aria-hidden="true" className="size-4" />
        ) : (
          <Copy aria-hidden="true" className="size-4" />
        )}
        {copied ? strings.copied : strings.copy}
      </Button>
    </li>
  );
}

/**
 * How to connect a provider (issue 251): numbered Banglish steps, then every value to paste into the provider's own
 * panel (callback, IPN, webhook addresses on this site, the server IP) with Copy buttons.
 */
export function ProviderSetupGuide({ setup, origin, serverIp, strings }: ProviderSetupGuideProps) {
  return (
    <details className="group rounded-xl border border-electric-100 bg-electric-50/60 p-4">
      <summary className="min-h-11 cursor-pointer list-inside text-[14.5px] font-semibold text-navy-900 marker:text-brand-700 md:min-h-0">
        {strings.title}
      </summary>
      <ol
        className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-[14px] leading-relaxed text-ink-900"
        lang="bn-Latn"
      >
        {setup.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {setup.panel && setup.panel.length > 0 ? (
        <>
          <p className="mt-4 text-[13px] font-semibold text-mist-700">{strings.values}</p>
          <ul className="mt-2 flex flex-col gap-2">
            {setup.panel.map((item) =>
              item.serverIp ? (
                serverIp ? (
                  <CopyRow key={item.label} label={item.label} value={serverIp} strings={strings} />
                ) : (
                  <li key={item.label} className="text-[13.5px] text-mist-700">
                    {item.label}: {strings.noIp}
                  </li>
                )
              ) : (
                <CopyRow
                  key={item.label}
                  label={item.label}
                  value={`${origin}${item.path ?? ""}`}
                  strings={strings}
                />
              ),
            )}
          </ul>
        </>
      ) : null}
    </details>
  );
}
