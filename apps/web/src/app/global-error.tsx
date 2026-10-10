"use client";

import "./globals.css";

type GlobalErrorProps = { error: Error & { digest?: string }; reset: () => void };

/**
 * Last-resort boundary when the root layout itself fails: it replaces the whole document, so no data, messages or
 * site frame are available. The copy is fixed English (D116); every other error renders the site's error.tsx.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-white font-sans text-ink-900">
        <main className="mx-auto flex max-w-xl flex-col items-start gap-4 px-6 py-16">
          <p className="text-[14px] font-bold tracking-[0.18em] text-brand-700 uppercase">Error</p>
          <h1 className="text-[32px] leading-tight font-extrabold text-navy-900">
            Something went wrong on our side
          </h1>
          <p className="text-[16px] text-mist-700">
            Your request was not lost. Try again in a minute; if it still fails, call or WhatsApp
            Waafa and quote this code: <strong>{error.digest ?? "WEB"}</strong>
          </p>
          <button
            type="button"
            onClick={reset}
            className="min-h-12 rounded-full bg-primary px-6 font-semibold text-primary-foreground"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
