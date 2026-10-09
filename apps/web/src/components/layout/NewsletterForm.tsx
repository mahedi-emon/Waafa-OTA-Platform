"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "cn";

type NewsletterFormProps = {
  placeholder: string;
  button: string;
  labels: { email: string; invalid: string; subscribed: string };
};

const EmailSchema = z.email();

/**
 * Footer newsletter signup (FR-FTR-05). Phase A validates and confirms without storing anything (Decision D35);
 * Phase C posts to the API with Turnstile and a rate limit.
 */
function NewsletterForm({ placeholder, button, labels }: NewsletterFormProps) {
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const value = String(new FormData(form).get("email") ?? "").trim();
    if (!EmailSchema.safeParse(value).success) {
      setError(labels.invalid);
      return;
    }
    setError(null);
    form.reset();
    toast.success(labels.subscribed);
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          {labels.email}
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "newsletter-error" : undefined}
          className={cn(
            "h-12 min-w-0 flex-1 rounded-full border bg-white px-5 text-base text-ink-900 outline-none placeholder:text-mist-500 focus-visible:border-electric-600 focus-visible:ring-3 focus-visible:ring-ring/30",
            error ? "border-danger-600" : "border-mist-300",
          )}
        />
        <button
          type="submit"
          className="h-12 shrink-0 cursor-pointer rounded-full bg-navy-900 px-6 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-royal-800 focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          {button}
        </button>
      </div>
      <p id="newsletter-error" role="alert" className="min-h-5 px-5 text-[13px] text-danger-600">
        {error}
      </p>
    </form>
  );
}

export { NewsletterForm };
