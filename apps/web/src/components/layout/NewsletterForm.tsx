"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "cn";

type NewsletterFormProps = {
  placeholder: string;
  button: string;
  labels: { email: string; invalid: string; subscribed: string; failed: string };
  /** Where the form sits, stored with the address (footer, blog). */
  source?: string;
};

const EmailSchema = z.email();

/**
 * Newsletter signup (FR-FTR-05): validates in the browser, then posts to /api/newsletter, which stores the address
 * in API mode (D35 in fixture mode: confirmed without storing).
 */
function NewsletterForm({ placeholder, button, labels, source = "footer" }: NewsletterFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const form = event.currentTarget;
    const value = String(new FormData(form).get("email") ?? "").trim();
    if (!EmailSchema.safeParse(value).success) {
      setError(labels.invalid);
      return;
    }
    setError(null);
    setSending(true);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, source }),
      });
      if (!response.ok) {
        setError(response.status === 422 ? labels.invalid : labels.failed);
        return;
      }
      form.reset();
      toast.success(labels.subscribed);
    } catch {
      setError(labels.failed);
    } finally {
      setSending(false);
    }
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <label htmlFor={`newsletter-email-${source}`} className="sr-only">
          {labels.email}
        </label>
        <input
          id={`newsletter-email-${source}`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `newsletter-error-${source}` : undefined}
          className={cn(
            "h-12 min-w-0 flex-1 rounded-full border bg-white px-5 text-base text-ink-900 outline-none placeholder:text-mist-500 focus-visible:border-electric-600 focus-visible:ring-3 focus-visible:ring-ring/30",
            error ? "border-danger-600" : "border-mist-300",
          )}
        />
        <button
          type="submit"
          disabled={sending}
          aria-busy={sending || undefined}
          className="h-12 shrink-0 cursor-pointer rounded-full bg-navy-900 px-6 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-royal-800 focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-wait disabled:opacity-80"
        >
          {button}
        </button>
      </div>
      <p
        id={`newsletter-error-${source}`}
        role="alert"
        className="min-h-5 px-5 text-[13px] text-danger-600"
      >
        {error}
      </p>
    </form>
  );
}

export { NewsletterForm };
