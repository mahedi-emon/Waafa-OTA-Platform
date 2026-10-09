import { cn } from "cn";

/** The 3 px ribbon line: active-tab marker, route-change progress, small accents. */
function RibbonLine({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("block h-[3px] rounded-full bg-(image:--ribbon)", className)}
    />
  );
}

export { RibbonLine };
