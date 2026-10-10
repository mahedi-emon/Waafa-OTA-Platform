import { cn } from "cn";

type CountryCodeProps = { code: string; className?: string };

/** Two-letter country mark used instead of flag images or emoji ("TH", "EU" for Schengen). Decorative. */
function CountryCode({ code, className }: CountryCodeProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid h-7 w-9 shrink-0 place-items-center rounded-md bg-navy-900 font-display text-[11px] font-extrabold tracking-wider text-white",
        className,
      )}
    >
      {code}
    </span>
  );
}

export { CountryCode };
