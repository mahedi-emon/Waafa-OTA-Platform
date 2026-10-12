import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { SmartImage } from "./SmartImage";
import { countryFlagSrc } from "./countryFlagSrc";

const flagVariants = cva(
  "relative inline-block shrink-0 overflow-hidden bg-mist-100 shadow-[0_1px_2px_rgb(2_13_57/0.12)] ring-1 ring-navy-900/10",
  {
    variants: {
      size: {
        xs: "h-3 w-4 rounded-[2px]",
        sm: "h-[15px] w-5 rounded-[3px]",
        md: "h-[21px] w-7 rounded-[4px]",
        lg: "h-[30px] w-10 rounded-[5px]",
      },
    },
    defaultVariants: { size: "md" },
  },
);

const codeVariants = cva(
  "grid shrink-0 place-items-center rounded-md bg-navy-900 font-display font-extrabold tracking-wider text-white",
  {
    variants: {
      size: {
        xs: "h-3 w-4 text-[6px]",
        sm: "h-[15px] w-5 text-[7px]",
        md: "h-[21px] w-7 text-[9px]",
        lg: "h-[30px] w-10 text-[11px]",
      },
    },
    defaultVariants: { size: "md" },
  },
);

type CountryFlagProps = VariantProps<typeof flagVariants> & {
  /** ISO 3166-1 alpha-2 code ("MY"), or "EU" for Schengen. */
  code: string;
  className?: string;
};

/**
 * A country's flag (self-hosted SVG, 4:3) beside its name. Decorative: the country name is always next to it, so the
 * image has empty alt text. Codes without a flag fall back to the two-letter mark.
 */
function CountryFlag({ code, size, className }: CountryFlagProps) {
  const src = countryFlagSrc(code);
  if (!src) {
    return (
      <span aria-hidden="true" className={cn(codeVariants({ size }), className)}>
        {code.toUpperCase()}
      </span>
    );
  }
  return (
    <span aria-hidden="true" className={cn(flagVariants({ size }), className)}>
      <SmartImage src={src} alt="" fill unoptimized sizes="40px" className="object-cover" />
    </span>
  );
}

export { CountryFlag };
