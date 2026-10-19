import Image from "next/image";
import { cn } from "cn";

type AdminThumbProps = {
  src?: string | undefined;
  /** Shown when there's no photo: the record's initials. */
  name?: string;
  size?: "sm" | "md";
  className?: string;
};

const SIZE = { sm: 32, md: 40 } as const;

/**
 * A record's small square photo in pickers, lists and search results; initials when there's none. Photos from other
 * sites skip the image optimiser, so an address typed by staff never breaks the page.
 */
function AdminThumb({ src, name = "", size = "md", className }: AdminThumbProps) {
  const pixels = SIZE[size];
  const box = cn(
    "shrink-0 overflow-hidden rounded-lg border border-mist-200 bg-mist-100",
    size === "sm" ? "size-8" : "size-10",
    className,
  );
  if (!src) {
    const initials = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("");
    return (
      <span
        aria-hidden="true"
        className={cn(box, "flex items-center justify-center text-[12px] font-bold text-mist-600")}
      >
        {initials}
      </span>
    );
  }
  return (
    <span className={box}>
      <Image
        src={src}
        alt=""
        width={pixels}
        height={pixels}
        sizes={`${pixels}px`}
        unoptimized={/^https?:\/\//.test(src)}
        className="size-full object-cover"
      />
    </span>
  );
}

export { AdminThumb };
