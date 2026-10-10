"use client";

import { useState, type ReactNode } from "react";
import { CircleAlert, Home, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import { whatsappLink, type LeadCreateInput, type LeadCreated } from "@waafa/shared";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { ContactStepValues } from "@/lib/leads/contactForm";
import { ContactStep } from "./ContactStep";
import { LeadSuccess } from "./LeadSuccess";

type LeadRequestCardProps<T> = {
  /** id of the card heading (names the region). */
  titleId: string;
  kicker: string;
  title: string;
  lead: string;
  /** Shown under the header, e.g. the chosen group fare or package. */
  banner?: ReactNode;
  secondStepLabel: string;
  countries: Array<{ code: string; name: string; dial: string }>;
  emailRequired: boolean;
  phoneDisplay: string;
  whatsappE164: string;
  /** Turns the two steps into the shared lead contract (the server validates again). */
  buildLead: (contact: ContactStepValues, values: T, page: string) => LeadCreateInput;
  renderSecondStep: (step: {
    sending: boolean;
    goBack: () => void;
    submit: (values: T) => void;
  }) => ReactNode;
  success: {
    title: string;
    lead: string;
    steps: Array<{ title: string; body: ReactNode }>;
    whatsappMessage: (reference: string) => string;
    againHref: string;
    /** Defaults to "Search again"; packages say "More packages". */
    againLabel?: string;
  };
};

type Phase = "contact" | "second" | "sent";

/**
 * The two-step lead request used by every Manual module (flights, hotels, packages, visa…): contact first, then the
 * module's own step, sent to POST /api/leads with one idempotency key per request (a double tap or a retry makes
 * one lead), then the boarding-pass success with the reference.
 */
function LeadRequestCard<T>(props: LeadRequestCardProps<T>) {
  const t = useTranslations("Leads");
  const [phase, setPhase] = useState<Phase>("contact");
  const [contact, setContact] = useState<ContactStepValues>({
    name: "",
    phoneCountry: props.countries[0]?.code ?? "BD",
    phone: "",
    email: "",
  });
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<"retry" | "rate" | null>(null);
  const [created, setCreated] = useState<LeadCreated | null>(null);
  // One key per request: a double tap or a retry reuses it; a new key is made after a success.
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);

  const goTo = (next: Phase) => {
    setPhase(next);
    window.requestAnimationFrame(() =>
      document
        .getElementById(`${props.titleId}-card`)
        ?.scrollIntoView({ block: "start", behavior: "smooth" }),
    );
  };

  const submit = async (values: T) => {
    if (sending) return;
    setSending(true);
    setFailure(null);
    const key = idempotencyKey ?? crypto.randomUUID();
    setIdempotencyKey(key);
    try {
      const lead = props.buildLead(contact, values, window.location.pathname);
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey: key, lead }),
      });
      if (!response.ok) {
        setFailure(response.status === 429 ? "rate" : "retry");
        return;
      }
      setCreated((await response.json()) as LeadCreated);
      setIdempotencyKey(null);
      goTo("sent");
    } catch {
      setFailure("retry");
    } finally {
      setSending(false);
    }
  };

  if (phase === "sent" && created) {
    return (
      <div id={`${props.titleId}-card`} className="scroll-mt-28">
        <LeadSuccess
          title={props.success.title}
          lead={props.success.lead}
          reference={created.reference}
          labels={{
            reference: t("success.reference"),
            copy: t("success.copy"),
            copied: t("success.copied"),
            copyFailed: t("success.copyFailed"),
          }}
          steps={props.success.steps}
          actions={
            <>
              <Button asChild variant="whatsapp">
                <a
                  href={whatsappLink(
                    props.whatsappE164,
                    props.success.whatsappMessage(created.reference),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon />
                  {t("success.whatsapp")}
                </a>
              </Button>
              <Button asChild variant="secondary">
                <Link href={props.success.againHref}>
                  <Search aria-hidden="true" />
                  {props.success.againLabel ?? t("success.again")}
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/">
                  <Home aria-hidden="true" />
                  {t("success.home")}
                </Link>
              </Button>
            </>
          }
          footnote={contact.email ? t("success.emailCopy") : undefined}
        />
      </div>
    );
  }

  return (
    <div id={`${props.titleId}-card`} className="scroll-mt-28">
      <section
        aria-labelledby={props.titleId}
        className="overflow-hidden rounded-[20px] border border-mist-200 bg-white shadow-sm"
      >
        <header className="flex flex-col gap-1.5 border-b border-mist-200 bg-mist-25 px-5 py-5 md:px-7">
          <p className="type-label text-brand-700">{props.kicker}</p>
          <h2
            id={props.titleId}
            className="font-display text-[22px] leading-tight font-bold text-navy-900"
          >
            {props.title}
          </h2>
          <p className="max-w-[60ch] text-[14.5px] leading-relaxed text-mist-600">{props.lead}</p>
        </header>
        {props.banner}
        <ol aria-label={t("steps.label")} className="flex gap-2 px-5 pt-5 md:px-7">
          {(["contact", "second"] as const).map((step, index) => {
            const current = phase === step;
            const done = step === "contact" && phase === "second";
            return (
              <li
                key={step}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold",
                  current
                    ? "bg-navy-900 text-white"
                    : done
                      ? "bg-success-50 text-success-600"
                      : "bg-mist-100 text-mist-600",
                )}
              >
                <span className="grid size-5 place-items-center rounded-full bg-white/20 tabular-nums">
                  {index + 1}
                </span>
                {step === "contact" ? t("steps.contact") : props.secondStepLabel}
              </li>
            );
          })}
        </ol>
        <div className="px-5 pt-5 pb-6 md:px-7">
          {failure ? (
            <div
              role="alert"
              className="mb-5 flex gap-3 rounded-xl border border-danger-600/30 bg-danger-25 p-4"
            >
              <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger-600" />
              <div>
                <p className="text-[15px] font-semibold text-navy-900">{t("failure.title")}</p>
                <p className="text-[14px] text-mist-700">
                  {failure === "rate"
                    ? t("failure.tooMany")
                    : t("failure.body", { phone: props.phoneDisplay })}
                </p>
              </div>
            </div>
          ) : null}
          {phase === "contact" ? (
            <ContactStep
              defaultValues={contact}
              emailRequired={props.emailRequired}
              countries={props.countries}
              onSubmit={(values) => {
                setContact(values);
                goTo("second");
              }}
            />
          ) : (
            props.renderSecondStep({ sending, goBack: () => goTo("contact"), submit })
          )}
        </div>
      </section>
    </div>
  );
}

export { LeadRequestCard };
