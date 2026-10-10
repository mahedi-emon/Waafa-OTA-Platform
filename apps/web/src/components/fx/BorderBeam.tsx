import { cn } from "cn";

type BorderBeamProps = { className?: string };

/**
 * A light that runs round the border every 7 s (MOTION.md §3, after 21st.dev Border Beam 18473): a rotating
 * conic layer masked to a 1 px ring, so only `transform` animates. Desktop pointers only; hidden under reduced
 * motion. The parent needs `relative` and a border radius.
 */
function BorderBeam({ className }: BorderBeamProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 hidden overflow-hidden rounded-[inherit] p-px",
        "[mask:linear-gradient(black,black)_content-box_exclude,linear-gradient(black,black)]",
        "motion-reduce:hidden! pointer-fine:lg:block",
        className,
      )}
    >
      <span className="absolute top-1/2 left-1/2 aspect-square w-[180%] -translate-1/2 animate-beam bg-[conic-gradient(from_0deg,transparent_0deg,transparent_290deg,var(--color-sky-500)_335deg,var(--color-electric-600)_352deg,transparent_360deg)] opacity-70" />
    </span>
  );
}

export { BorderBeam };
