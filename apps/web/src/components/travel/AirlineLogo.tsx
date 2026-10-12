import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type { Airline } from "@waafa/shared";
import { SmartImage } from "@/components/media/SmartImage";
import { airlineLogoSrc } from "./airlineLogoSrc";

const frame = cva("relative grid shrink-0 place-items-center overflow-hidden", {
  variants: {
    size: {
      sm: "size-6 rounded-md",
      md: "size-8 rounded-lg",
      lg: "size-10 rounded-xl",
    },
  },
  defaultVariants: { size: "md" },
});

const codeText = cva("font-display font-extrabold tracking-wider text-white", {
  variants: { size: { sm: "text-[9px]", md: "text-[11px]", lg: "text-[12px]" } },
  defaultVariants: { size: "md" },
});

type AirlineLogoProps = VariantProps<typeof frame> & {
  airline: Pick<Airline, "code" | "logo">;
  className?: string;
};

/**
 * An airline's square mark beside its name (issue 156): the logo uploaded in Admin, else the bundled logo for the
 * IATA code, else the code on navy. Decorative: the airline name is always next to it.
 */
function AirlineLogo({ airline, size, className }: AirlineLogoProps) {
  const src = airlineLogoSrc(airline);
  if (!src) {
    return (
      <span aria-hidden="true" className={cn(frame({ size }), "bg-navy-900", className)}>
        <span className={codeText({ size })}>{airline.code}</span>
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(frame({ size }), "bg-white ring-1 ring-navy-900/10", className)}
    >
      <SmartImage src={src} alt="" fill sizes="40px" className="object-contain" />
    </span>
  );
}

export { AirlineLogo };
